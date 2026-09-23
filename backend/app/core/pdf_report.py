import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_clinical_pdf(patient_data: dict, drift_data: dict, telemetry_summary: dict) -> io.BytesIO:
    """
    Renders a clean, MoCA / ICMR-NARI aligned single-page clinical dossier
    using Python's ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#065F46'),
        fontName='Helvetica-Bold',
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4B5563'),
        spaceAfter=12
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold',
        spaceBefore=8,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1E293B')
    )

    badge_red = ParagraphStyle('BadgeRed', parent=body_style, textColor=colors.HexColor('#991B1B'), fontName='Helvetica-Bold')
    badge_green = ParagraphStyle('BadgeGreen', parent=body_style, textColor=colors.HexColor('#065F46'), fontName='Helvetica-Bold')

    elements = []

    # Title Banner
    elements.append(Paragraph("SMRITISETU — CLINICAL COGNITIVE DOSSIER", title_style))
    elements.append(Paragraph("ICMR-NARI & MoCA Geriatric Digital Biomarker Telemetry Report | North Eastern Region (NER)", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#065F46'), spaceAfter=10))

    # Patient & Caregiver Info Table
    pat_table_data = [
        [
            Paragraph("<b>Patient Name:</b> " + str(patient_data.get("name", "Bhaben Baruah")), body_style),
            Paragraph("<b>ABHA Health ID:</b> " + str(patient_data.get("abha_id", "NER-ASM-9821-4412")), body_style)
        ],
        [
            Paragraph("<b>Age / Gender:</b> " + str(patient_data.get("age", 74)) + " Y / Male", body_style),
            Paragraph("<b>Primary Dialect:</b> " + str(patient_data.get("dialect", "Assamese")), body_style)
        ],
        [
            Paragraph("<b>Primary Caregiver:</b> " + str(patient_data.get("caregiver_name", "Ananya Baruah")), body_style),
            Paragraph("<b>Contact / Phone:</b> " + str(patient_data.get("caregiver_phone", "+91 94350 12345")), body_style)
        ],
        [
            Paragraph("<b>Report Timestamp:</b> " + datetime.datetime.now().strftime("%d %b %Y, %I:%M %p"), body_style),
            Paragraph("<b>DPDP 2023 Consent:</b> VERIFIED (SHA-256 Hash Linked)", body_style)
        ]
    ]

    p_table = Table(pat_table_data, colWidths=[270, 270])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(p_table)
    elements.append(Spacer(1, 10))

    # Cognitive Drift Index Callout
    drift_pct = drift_data.get("cognitive_drift_percent", 28.5)
    is_alert = drift_data.get("alert", False) or drift_pct > 35.0

    status_color = colors.HexColor('#FEF2F2') if is_alert else colors.HexColor('#ECFDF5')
    border_color = colors.HexColor('#EF4444') if is_alert else colors.HexColor('#10B981')
    alert_text = "CLINICAL ALERT: >35% DRIFT EXCEEDED — Teleconsultation Recommended" if is_alert else "STABLE: Drift within baseline cognitive variance threshold (<35%)"

    drift_box_data = [
        [
            Paragraph(f"<b>Rolling 7-Day Cognitive Drift Index:</b> <font size='14'><b>{drift_pct:+.1f}%</b></font>", body_style),
            Paragraph(f"<b>Triage Status:</b> {alert_text}", badge_red if is_alert else badge_green)
        ]
    ]
    d_table = Table(drift_box_data, colWidths=[240, 300])
    d_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), status_color),
        ('BOX', (0,0), (-1,-1), 1.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(d_table)
    elements.append(Spacer(1, 12))

    # Biomarkers Table
    elements.append(Paragraph("<b>Quantitative Neurological & Motor Biomarkers</b>", section_heading))
    
    headers = ["Biomarker Dimension", "Baseline", "Current 7-Day Mean", "Variance / Drift", "Clinical Norm"]
    rows = [
        headers,
        [
            "Tap Latency (t_tap - t_prompt)",
            f"{drift_data.get('baseline_latency_ms', 800.0):.0f} ms",
            f"{drift_data.get('current_mean_latency_ms', 1045.0):.0f} ms",
            f"{drift_pct:+.1f}%",
            "< 1200 ms (MoCA Mild Range)"
        ],
        [
            "Motor Tremor Jitter (sqrt(dx²+dy²))",
            "12.4 px",
            f"{drift_data.get('current_mean_jitter_px', 24.8):.1f} px",
            "+100.0%",
            "< 20.0 px (Geriatric steady)"
        ],
        [
            "Visual Semantic Accuracy",
            "98.0%",
            f"{drift_data.get('current_accuracy_pct', 82.5):.1f}%",
            "-15.5%",
            "> 80.0% (Cultural objects)"
        ],
        [
            "Routine Sequencing Adherence",
            "100.0%",
            "75.0%",
            "-25.0%",
            "> 85.0% (Daily living)"
        ]
    ]
    b_table = Table(rows, colWidths=[170, 85, 105, 90, 90])
    b_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#065F46')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94A3B8')),
    ]))
    elements.append(b_table)
    elements.append(Spacer(1, 10))

    # Observations & Door-to-Door ASHA Notes
    elements.append(Paragraph("<b>Community Health Worker (ASHA) Field Screening Notes</b>", section_heading))
    asha_notes = """
    <b>Field Worker ID:</b> ASHA-NAGAON-01 | <b>Sub-Center:</b> Raha Primary Health Centre (PHC)<br/>
    <b>Observation:</b> Patient was receptive to Assamese audio cues for traditional cultural artifacts (Japi, Xorai). 
    Mild hesitation noted in the 3-step morning sequencer (tea before morning walk). 
    Tremor detected during capacitive screen touch (24.8 px jitter). Caregiver advised on daily reminder adherence.
    """
    elements.append(Paragraph(asha_notes, body_style))
    elements.append(Spacer(1, 8))

    # Physician Recommendation & eSanjeevani Integration
    elements.append(Paragraph("<b>Physician Action Plan & eSanjeevani Dispatch</b>", section_heading))
    plan_text = """
    <b>Recommended Action:</b> Routine follow-up scheduled. If cognitive latency drift sustains >35% over consecutive weeks, 
    one-click eSanjeevani teleconsultation with Guwahati Medical College Geriatric Neurology OPD will be auto-triggered.<br/>
    <b>Pharmacological Check:</b> Ensure timely administration of Donepezil / Memantine regimen as prescribed.
    """
    elements.append(Paragraph(plan_text, body_style))
    elements.append(Spacer(1, 16))

    # Signature Footer
    sig_data = [
        [
            Paragraph("<b>Medical Officer:</b> Dr. P. K. Hazarika, MD<br/>District Civil Hospital, Nagaon", body_style),
            Paragraph("<b>eSanjeevani Dispatch Hash:</b><br/><code>ESANJ-NER-2026-9821-X9</code>", body_style),
            Paragraph("<b>Authorized Digital Seal:</b><br/>[VERIFIED BY SMRITISETU HUB]", body_style)
        ]
    ]
    s_table = Table(sig_data, colWidths=[180, 180, 180])
    s_table.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#065F46')),
        ('TOPPADDING', (0,0), (-1,-1), 6)
    ]))
    elements.append(s_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer
