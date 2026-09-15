import { useState, useMemo } from "react";

export function useSearch(data, searchKeys) {
  const [query, setQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!query?.trim()) return data;

    const lowerQuery = query.trim().toLowerCase();

    return data.filter((item) =>
      searchKeys.some((key) => {
        // support nested keys using dot notation
        const value = key.split('.').reduce((obj, k) => obj?.[k], item);
        return value && String(value).toLowerCase().includes(lowerQuery);
      })
    );
  }, [data, query, searchKeys]);

  return {
    query,
    setQuery,
    filteredData,
  };
}
