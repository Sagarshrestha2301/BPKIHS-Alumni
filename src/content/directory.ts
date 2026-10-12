export const directoryPage = {
  title: 'Alumni directory',
  description: 'Find fellow BPKIHS graduates by name, programme, workplace or place.',
  search: {
    label: 'Search alumni',
    formLabel: 'Directory search',
    placeholder: 'Name, programme, workplace or place',
    button: 'Search',
  },
  sort: {
    label: 'Sort by',
    options: {
      name: 'Name (A to Z)',
      batch_newest: 'Batch (newest first)',
      batch_oldest: 'Batch (oldest first)',
      recently_joined: 'Recently joined',
    },
  },
  resultsLabel: 'Alumni results',
  empty: {
    title: 'No alumni found',
    description:
      'Check the spelling or try fewer words. Only approved profiles that allow it are listed.',
    clear: 'Clear search',
  },
  sampleNote: 'Sample data',
} as const;
