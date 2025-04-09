export default function ChartComponent({ data }) {
    return (
      <div className="border rounded-lg p-4 h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Chart Component Placeholder</div>
          <div className="text-sm text-gray-500">
            <p>This will display a {data.type} chart with the following data:</p>
            {data.labels && (
              <div className="mt-2">
                <p>Categories: {data.labels.join(', ')}</p>
              </div>
            )}
            {data.datasets && (
              <div className="mt-2">
                <p>Dataset: {data.datasets[0].label}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  