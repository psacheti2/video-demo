export default function ReportComponent({ data }) {
    return (
      <div className="border rounded-lg p-4 h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Report Component Placeholder</div>
          <div className="text-sm text-gray-500">
            <p>This will display a report with the following sections:</p>
            <ul className="list-disc list-inside mt-2">
              {data.sections.map((section, index) => (
                <li key={index}>{section}</li>
              ))}
            </ul>
            {data.recipient && (
              <p className="mt-2">Prepared for: {data.recipient}</p>
            )}
          </div>
        </div>
      </div>
    );
  }