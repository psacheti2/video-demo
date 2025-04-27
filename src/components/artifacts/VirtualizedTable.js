import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table, X, ChevronDown, ChevronUp, ListFilter } from 'lucide-react';
import _ from 'lodash';

const VirtualizedTable = ({ 
  tableData, 
  setTableData,
  currentTableIndex, 
  setCurrentTableIndex, 
  tableTitles,
  selectedRowIndex, 
  setSelectedRowIndex,
  selectedColIndex, 
  setSelectedColIndex,
  highlightFeatureByRowProperties,
  resetLayerHighlighting,
  handleCellEdit,
  tableHeight,
  setTableHeight,
  showTable,
  setIsModified,
  originalRowsMap,
  setOriginalRowsMap
}) => {
  const [contextMenu, setContextMenu] = useState({
    visible: false, x: 0, y: 0, type: null, index: null,
    columnName: null,
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterColumn, setFilterColumn] = useState(null);
  const [filterOptions, setFilterOptions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDialogPosition, setFilterDialogPosition] = useState({ x: 0, y: 0 });
  const [showFilterIcons, setShowFilterIcons] = useState(false);
  const dragHandleRef = useRef(null);
  const tableContainerRef = useRef(null);
  const headerContainerRef = useRef(null);
  const tableBodyRef = useRef(null);

  // Store a memoized version of the current table data
  const currentTable = useMemo(() => 
    tableData[currentTableIndex] || { headers: [], rows: [] }, 
    [tableData, currentTableIndex]
  );

  // Throttle row highlight function to prevent excessive processing
  const throttledHighlight = useCallback(
    _.throttle((rowIndex) => {
      if (rowIndex !== null && currentTable.rows[rowIndex]) {
        resetLayerHighlighting();
        highlightFeatureByRowProperties(rowIndex);
      }
    }, 150),
    [currentTable.rows, resetLayerHighlighting, highlightFeatureByRowProperties]
  );

  // Sync horizontal scroll between header and body
  const syncScroll = (e) => {
    if (headerContainerRef.current && e.target === tableBodyRef.current) {
      headerContainerRef.current.scrollLeft = e.target.scrollLeft;
    }
    if (tableBodyRef.current && e.target === headerContainerRef.current) {
      tableBodyRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // Set up scroll sync
  useEffect(() => {
    const headerEl = headerContainerRef.current;
    const bodyEl = tableBodyRef.current;
    
    if (headerEl) headerEl.addEventListener('scroll', syncScroll);
    if (bodyEl) bodyEl.addEventListener('scroll', syncScroll);
    
    return () => {
      if (headerEl) headerEl.removeEventListener('scroll', syncScroll);
      if (bodyEl) bodyEl.removeEventListener('scroll', syncScroll);
    };
  }, []);

  // Clean up event listeners
  useEffect(() => {
    return () => {
      throttledHighlight.cancel();
    };
  }, [throttledHighlight]);

  // Memoize the row renderer function for virtualized list
  const Row = useCallback(({ index, style }) => {
    const row = currentTable.rows[index];
    const isSelected = selectedRowIndex === index;
    
    if (!row) return null;

    return (
      <div 
        style={{
          ...style,
          display: 'flex',
          backgroundColor: isSelected ? '#ccecec' : (index % 2 === 0 ? '#f9f9f9' : '#ffffff'),
          cursor: 'pointer',
          borderBottom: '1px solid #e6e6e6',
          width: 'fit-content',
          minWidth: '100%'
        }}
        onClick={() => {
          setSelectedRowIndex(index);
          throttledHighlight(index);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          handleRightClick(e, 'row', index);
        }}
        className="hover:bg-gray-50"
      >
        <div 
          className="sticky left-0 text-center text-xs font-semibold border-r border-gray-300 bg-gray-100 flex items-center justify-center"
          style={{ width: '40px', minWidth: '40px', zIndex: 2 }}
        >
          {index + 1}
        </div>
        
        {currentTable.headers.map((header, colIdx) => (
  <div
    key={`${index}-${colIdx}`}
    contentEditable
    suppressContentEditableWarning
    onClick={(e) => e.stopPropagation()}
    onBlur={(e) => {
      const value = e.target.innerText.trim();
      handleCellEdit(index, header, value);
      setIsModified(true);
    }}
    className={`px-2 py-1 text-xs border-r border-gray-200 overflow-hidden text-ellipsis whitespace-nowrap ${
      selectedColIndex === colIdx ? 'bg-[#ccecec]' : ''
    } ${colIdx === 0 ? 'sticky left-10 bg-white z-[2] border-r border-gray-300' : ''}`}
    style={{
      width: `${columnWidths[colIdx]}px`,
      flex: '0 0 auto',
      outline: 'none',
    }}
  >
    {row[header] || ''}
  </div>
))}


      </div>
    );
  }, [currentTable, selectedRowIndex, selectedColIndex, throttledHighlight, setSelectedRowIndex, handleCellEdit]);

  const handleRightClick = (e, type, index, columnName) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'column') {
      setContextMenu({ 
        visible: true, 
        x: e.clientX, 
        y: e.clientY, 
        type, 
        index, 
        columnName 
      });
    } else {
      setContextMenu({ 
        visible: true, 
        x: e.clientX, 
        y: e.clientY, 
        type, 
        index 
      });
    }
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, type: null, index: null });
  }, []);

  // Drag functionality for table resize
  const dragState = useRef({
    isDragging: false,
    startY: 0,
    startHeight: 0,
    containerHeight: 0
  });

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const container = tableContainerRef.current?.closest('.map-container') || document.body;

    dragState.current = {
      isDragging: true,
      startY: e.clientY,
      startHeight: tableHeight,
      containerHeight: container.clientHeight
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';

    if (dragHandleRef.current) {
      dragHandleRef.current.classList.add('dragging');
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    
    const deltaY = dragState.current.startY - e.clientY;
    const containerHeight = dragState.current.containerHeight;
    const minTableHeight = 100;
    const maxTableHeight = containerHeight - 120;

    let newHeight = dragState.current.startHeight + deltaY;
    newHeight = Math.max(minTableHeight, Math.min(maxTableHeight, newHeight));
    
    setTableHeight(newHeight);
  }, [setTableHeight]);

  const handleMouseUp = useCallback(() => {
    dragState.current.isDragging = false;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';

    if (dragHandleRef.current) {
      dragHandleRef.current.classList.remove('dragging');
    }
  }, [handleMouseMove]);

  // Handle sort, filter, delete operations
  const handleDeleteRow = (rowIndex) => {
    setTableData(prev => {
      const updated = [...prev];
      
      if (updated[currentTableIndex] && updated[currentTableIndex].rows) {
        const newRows = [...updated[currentTableIndex].rows];
        newRows.splice(rowIndex, 1);
        updated[currentTableIndex] = {
          ...updated[currentTableIndex],
          rows: newRows
        };
      }
      
      return updated;
    });
    
    setSelectedRowIndex(null);
    closeContextMenu();
    setIsModified(true);
  };

  const handleDeleteColumn = (columnName) => {
    setTableData(prev => {
      const updated = [...prev];
      
      if (updated[currentTableIndex]) {
        const table = { ...updated[currentTableIndex] };
        table.headers = table.headers.filter(h => h !== columnName);
        table.rows = table.rows.map(row => {
          const { [columnName]: _, ...rest } = row;
          return rest;
        });
        updated[currentTableIndex] = table;
      }
      
      return updated;
    });
    
    closeContextMenu();
    setIsModified(true);
  };

  const handleSortAZ = (columnName) => {
    setTableData(prev => {
      const updated = [...prev];
      
      if (updated[currentTableIndex] && updated[currentTableIndex].rows) {
        const sortedRows = [...updated[currentTableIndex].rows].sort((a, b) => {
          const aVal = a[columnName] || '';
          const bVal = b[columnName] || '';
          return String(aVal).localeCompare(String(bVal));
        });
        
        updated[currentTableIndex] = {
          ...updated[currentTableIndex],
          rows: sortedRows
        };
      }
      
      return updated;
    });
    
    closeContextMenu();
    setIsModified(true);
  };

  const handleSortZA = (columnName) => {
    setTableData(prev => {
      const updated = [...prev];
      
      if (updated[currentTableIndex] && updated[currentTableIndex].rows) {
        const sortedRows = [...updated[currentTableIndex].rows].sort((a, b) => {
          const aVal = a[columnName] || '';
          const bVal = b[columnName] || '';
          return String(bVal).localeCompare(String(aVal));
        });
        
        updated[currentTableIndex] = {
          ...updated[currentTableIndex],
          rows: sortedRows
        };
      }
      
      return updated;
    });
    
    closeContextMenu();
    setIsModified(true);
  };

  const handleResetTable = () => {
    const originalRows = originalRowsMap[currentTableIndex];
    
    if (!originalRows) return;
    
    setTableData(prev => {
      const updated = [...prev];
      updated[currentTableIndex] = {
        ...updated[currentTableIndex],
        rows: JSON.parse(JSON.stringify(originalRows))
      };
      return updated;
    });
    
    setIsModified(false);
    closeContextMenu();
  };

  const handleShowFilter = (columnName) => {
    // Create filter options from unique values in the column
    if (currentTable && currentTable.rows) {
      const uniqueValues = [...new Set(currentTable.rows.map(row => row[columnName]))];
      setFilterOptions(uniqueValues);
      
      // Initialize all values as selected
      setSelectedFilters(prev => ({
        ...prev,
        [columnName]: new Set(uniqueValues)
      }));
      
      setFilterColumn(columnName);
      setShowFilterDialog(true);
      
      // Get the position from the clicked element
      const columnHeader = document.querySelector(`[data-column="${columnName}"]`);
      if (columnHeader) {
        const rect = columnHeader.getBoundingClientRect();
        setFilterDialogPosition({ x: rect.right, y: rect.bottom });
      }
    }
    
    closeContextMenu();
    setShowFilterIcons(true);
  };

  const applyFilter = () => {
    if (!filterColumn || !selectedFilters[filterColumn]) {
      setShowFilterDialog(false);
      return;
    }
    
    setTableData(prev => {
      const updated = [...prev];
      const original = originalRowsMap[currentTableIndex];
      
      if (original) {
        // Filter rows based on selected values
        updated[currentTableIndex] = {
          ...updated[currentTableIndex],
          rows: original.filter(row => 
            selectedFilters[filterColumn].has(row[filterColumn])
          )
        };
      }
      
      return updated;
    });
    
    setIsModified(true);
    setShowFilterDialog(false);
  };

  // Clean up event listeners on unmount
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible && !e.target.closest('.context-menu')) {
        closeContextMenu();
      }
      
      if (showFilterDialog && !e.target.closest('.filter-dialog')) {
        setShowFilterDialog(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [contextMenu.visible, closeContextMenu, handleMouseMove, handleMouseUp, showFilterDialog]);

  // Calculate estimated row heights for virtual list
  const rowHeight = 36; // Estimated height of each row
  const headerHeight = 80; // Height of header rows
  const listHeight = tableHeight - headerHeight - 20; // Available height for virtual list

  // Calculate column widths
  const columnWidths = useMemo(() => {
    return currentTable.headers.map(header => {
      // Set a fixed width for each column - you can adjust the base width
      return 120; 
    });
  }, [currentTable.headers]);

  // Calculate total width
  const totalWidth = useMemo(() => {
    return columnWidths.reduce((sum, width) => sum + width, 40); // 40px for row numbers
  }, [columnWidths]);

  return (
    <div 
      ref={tableContainerRef}
      className="absolute bottom-0 left-0 right-0 bg-white shadow-inner border-t border-gray-300 z-20"
      style={{ height: `${tableHeight}px` }}
    >
      {/* Table header with tabs */}
      <div className="flex justify-between items-center p-1 bg-white text-gray-800 border-b border-gray-200 h-10 px-4">
        {/* Tabs on the left */}
        <div className="flex space-x-1">
          {tableTitles.map((title, index) => (
            <button
              key={index}
              className={`px-2 py-1 border rounded-t-md text-xs font-medium transition-all duration-200
                ${currentTableIndex === index
                  ? 'bg-[#008080] text-white border-[#008080]'
                  : 'bg-white text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white'}
              `}
              onClick={() => {
                setCurrentTableIndex(index);
                setIsModified(false);
              }}
            >
              {title}
            </button>
          ))}
        </div>
      </div>



      {/* Table content */}
      <div className="h-[calc(100%-40px)] overflow-hidden p-2">
        {currentTable.headers && currentTable.headers.length > 0 ? (
          <div className="flex flex-col h-full">
           

            {/* Virtualized rows with synchronized horizontal scrolling */}
            <div 
  ref={tableBodyRef} 
  className="overflow-x-auto overflow-y-hidden flex-grow relative" 
  style={{ maxWidth: '100%' }}
>
  <div style={{ width: `${totalWidth}px`, minWidth: '100%' }}>
    
    {/* A/B/C Header Row */}
    <div className="flex border-b border-gray-300">
      <div className="sticky left-0 z-10 w-10 min-w-[40px] text-[10px] bg-gray-100 border border-gray-300 flex items-center justify-center">
        &nbsp;
      </div>
      {currentTable.headers.map((_, colIdx) => (
        <div
          key={`abc-${colIdx}`}
          onClick={() => setSelectedColIndex((prev) => (prev === colIdx ? null : colIdx))}
          onContextMenu={(e) => {
            e.preventDefault();
            handleRightClick(e, 'column', colIdx, currentTable.headers[colIdx]);
          }}
          className={`px-3 py-1 text-center text-[10px] font-semibold text-gray-700 uppercase border border-gray-300 
            ${selectedColIndex === colIdx ? 'bg-[#ccecec]' : 'bg-gray-100'}`}
          style={{ 
            width: `${columnWidths[colIdx]}px`, 
            minWidth: `${columnWidths[colIdx]}px`,
            flex: '0 0 auto'
          }}
        >
          {String.fromCharCode(65 + colIdx)}
        </div>
      ))}
    </div>

    {/* Actual column names (Name, Age, etc.) */}
    <div className="flex border-b border-gray-200">
      <div className="sticky left-0 z-10 w-10 min-w-[40px] bg-white"></div>
      {currentTable.headers.map((header, idx) => (
        <div
          key={`label-${idx}`}
          data-column={header}
          className="px-3 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider"
          style={{ 
            width: `${columnWidths[idx]}px`, 
            minWidth: `${columnWidths[idx]}px`,
            flex: '0 0 auto'
          }}
          onClick={() => setSelectedColIndex(idx)}
          onContextMenu={(e) => {
            e.preventDefault();
            handleRightClick(e, 'column', idx, header);
          }}
        >
          <div className="flex items-center justify-between">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap block max-w-full">
  {header}
</span>
            {showFilterIcons && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowFilter(header);
                }}
                className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <ListFilter size={10} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* Your Virtualized Rows */}
    <List
      height={listHeight > 0 ? listHeight : 200}
      itemCount={currentTable.rows.length}
      itemSize={rowHeight}
      width="100%"
      overscanCount={5}
      style={{
        overflowX: 'hidden', // Let the parent handle x-scrolling
        width: '100%',
      }}
    >
      {Row}
    </List>
  </div>
</div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <Table className="h-8 w-8 text-[#008080]/50 mb-2" />
            <p className="text-sm text-gray-500">No data available for this layer</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-[9999] w-28 rounded-md border border-gray-200 bg-white shadow-xl text-xs font-medium context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="py-1 text-gray-800">
            {contextMenu.type === 'row' && (
              <button
                onClick={() => handleDeleteRow(contextMenu.index)}
                className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Delete Row
              </button>
            )}

            {contextMenu.type === 'column' && (
              <>
                <button
                  onClick={() => handleDeleteColumn(currentTable.headers[contextMenu.index])}
                  className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Delete Column
                </button>

                <hr className="my-1 border-gray-200" />

                <button
                  onClick={() => handleShowFilter(currentTable.headers[contextMenu.index])}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  Filter
                </button>

                <button
                  onClick={() => handleSortAZ(currentTable.headers[contextMenu.index])}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  Sort A → Z
                </button>

                <button
                  onClick={() => handleSortZA(currentTable.headers[contextMenu.index])}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  Sort Z → A
                </button>

                <hr className="my-1 border-gray-200" />
                
                <button
                  onClick={handleResetTable}
                  className="w-full text-left px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter Dialog */}
      {showFilterDialog && filterColumn && (
        <div
          className="fixed z-[9999] bg-white rounded-xl p-2 filter-dialog"
          style={{
            top: `${filterDialogPosition.y}px`,
            left: `${filterDialogPosition.x}px`,
            transform: 'translate(-90%, 10px)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '220px',
            width: '140px',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[10px] font-semibold text-gray-800">Filter: {filterColumn}</h3>
            <button onClick={() => setShowFilterDialog(false)} className="text-gray-500 hover:text-gray-700">
              <X size={14} />
            </button>
          </div>

          <div className="mb-1">
            <input
              type="text"
              placeholder="Search..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full px-1 py-0.5 border border-gray-300 rounded-md text-[9px]"
              style={{ fontSize: '10px' }}
            />
          </div>

          {/* Filter options simplified for performance */}
          <div className="space-y-0.5 overflow-y-auto flex-grow" style={{ maxHeight: '110px' }}>
            {filterOptions
              .filter(option =>
                String(option || '').toLowerCase().includes(filterSearch.toLowerCase())
              )
              .slice(0, 50) // Limit to prevent performance issues
              .map((option, idx) => (
                <label key={idx} className="flex items-center space-x-1 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedFilters[filterColumn]?.has(option)}
                    onChange={() => {
                      setSelectedFilters(prev => {
                        const updated = new Set(prev[filterColumn]);
                        if (updated.has(option)) {
                          updated.delete(option);
                        } else {
                          updated.add(option);
                        }
                        return { ...prev, [filterColumn]: updated };
                      });
                    }}
                    className="h-2 w-2"
                  />
                  <span className="truncate text-[10px]">{String(option || '')}</span>
                </label>
              ))}
          </div>

          {/* Filter action buttons */}
          <div className="mt-1 flex justify-between space-x-1">
            <button
              onClick={() => setShowFilterDialog(false)}
              className="py-0.5 px-1 rounded-md bg-gray-200 text-gray-700 text-[10px] font-medium hover:bg-gray-300 flex-1"
            >
              Cancel
            </button>
            <button
              onClick={applyFilter}
              className="py-0.5 px-1 rounded-md bg-[#008080] text-white text-[10px] font-medium hover:bg-teal-700 flex-1"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedTable;