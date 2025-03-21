import React, {useState} from 'react';
import {useAdminReport} from './use-admin-report';
import {Trans} from '@ui/i18n/trans';
import {StaticPageTitle} from '../../seo/static-page-title';
import {AdminReportCardRow} from '@common/admin/analytics/admin-report-card-row';
import {VisitorsReportCharts} from '@common/admin/analytics/visitors-report-charts';
import {DateRangeValue} from '@ui/forms/input-field/date/date-range-picker/date-range-value';
import {DateRangePresets} from '@ui/forms/input-field/date/date-range-picker/dialog/date-range-presets';
import {ReportDateSelector} from '@common/admin/analytics/report-date-selector';

export function Component() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    // This week
    return DateRangePresets[2].getRangeValue();
  });
  const {isLoading, data} = useAdminReport({dateRange});
  const title = <Trans message="Visitors report" />;

  return (
    <div className="min-h-full gap-12 p-12 md:gap-18 md:p-18">
      <div className="mb-24 items-center justify-between gap-24 md:flex">
        <StaticPageTitle>{title}</StaticPageTitle>
        <h1 className="mb-24 text-3xl font-light md:mb-0">{title}</h1>
        <ReportDateSelector value={dateRange} onChange={setDateRange} />
      </div>
      <div className="chart-grid">
        <AdminReportCardRow report={data?.headerReport} />
        <VisitorsReportCharts
          report={data?.visitorsReport}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
