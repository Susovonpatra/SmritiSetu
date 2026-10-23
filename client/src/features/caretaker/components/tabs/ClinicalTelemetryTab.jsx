import React from 'react';
import { UnifiedAnalyticsDashboard } from '../UnifiedAnalyticsDashboard';

export function ClinicalTelemetryTab({
  driftMetrics,
  analyticsData,
  patternAnalytics,
  biographicalAnalytics,
  routineAnalytics,
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
      routineAnalytics={routineAnalytics}
      unifiedTimeline={unifiedTimeline && unifiedTimeline.length > 0 ? unifiedTimeline : analyticsData}
      isLoading={isLoading}
      onRefresh={onRefresh}
      onOpenReportModal={onOpenReportModal}
    />
  );
}
