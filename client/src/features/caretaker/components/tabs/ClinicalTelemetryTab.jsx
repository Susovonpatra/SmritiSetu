import React from 'react';
import { UnifiedAnalyticsDashboard } from '../UnifiedAnalyticsDashboard';

export function ClinicalTelemetryTab({
  driftMetrics,
  analyticsData,
  patternAnalytics,
  biographicalAnalytics,
  shapeAnalytics,
  unifiedTimeline,
  displayPatientName,
  onOpenReportModal,
  isLoading,
  onRefresh
}) {
  return (
    <UnifiedAnalyticsDashboard
      displayPatientName={displayPatientName}
      driftMetrics={driftMetrics}
      patternAnalytics={patternAnalytics}
      biographicalAnalytics={biographicalAnalytics}
      shapeAnalytics={shapeAnalytics}
      unifiedTimeline={unifiedTimeline && unifiedTimeline.length > 0 ? unifiedTimeline : analyticsData}
      isLoading={isLoading}
      onRefresh={onRefresh}
      onOpenReportModal={onOpenReportModal}
    />
  );
}
