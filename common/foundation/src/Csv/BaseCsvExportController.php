<?php

namespace Common\Csv;

use Auth;
use Carbon\Carbon;
use Common\Core\BaseController;
use Common\Csv\BaseCsvExportJob;
use Common\Csv\CsvExport;
use Illuminate\Http\Request;
use Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BaseCsvExportController extends BaseController
{
    public function __construct(protected Request $request)
    {
        $this->middleware('auth');
    }

    public function download(CsvExport $csvExport): StreamedResponse
    {
        if (
            !Auth::user()->hasPermission('admin') &&
            $csvExport->user_id !== Auth::id()
        ) {
            abort(403);
        }

        return Storage::download(
            $csvExport->filePath(),
            $csvExport->download_name,
        );
    }

    protected function exportUsing(BaseCsvExportJob $exportJob)
    {
        $csvExport = CsvExport::where(
            'cache_name',
            $exportJob->cacheName(),
        )->first();

        if (
            $csvExport &&
            $csvExport->created_at->greaterThan(Carbon::now()->addMinutes(-30))
        ) {
            return $this->success([
                'downloadPath' => $csvExport->downloadLink(),
            ]);
        }

        $this->dispatch($exportJob);
        return $this->success(['result' => 'jobQueued']);
    }
}
