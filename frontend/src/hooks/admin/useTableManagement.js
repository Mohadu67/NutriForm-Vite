import { useState, useMemo, useEffect, useCallback } from 'react';

export function useTableManagement({
  data = [],
  itemsPerPage = 20,
  filterFn = null,
  sortFn = null,
  searchKeys = [],
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('date-desc');

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterValue, sortValue]);

  // Filter data
  const filteredData = useMemo(() => {
    let result = data;

    // Apply custom filter function
    if (filterFn && filterValue !== 'all') {
      result = result.filter(item => filterFn(item, filterValue));
    }

    // Apply search
    if (searchQuery && searchKeys.length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        searchKeys.some(key => {
          const value = key.split('.').reduce((obj, k) => obj?.[k], item);
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    return result;
  }, [data, filterValue, searchQuery, filterFn, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortFn) return filteredData;
    return [...filteredData].sort((a, b) => sortFn(a, b, sortValue));
  }, [filteredData, sortValue, sortFn]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    paginatedData,
    filteredData,
    sortedData,
    totalItems: sortedData.length,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    resetPagination,
    searchQuery,
    setSearchQuery,
    filterValue,
    setFilterValue,
    sortValue,
    setSortValue,
  };
}
