export type StringData = {
  type: "string";
  column_id: string;
  value: string | null;
};

export type LinkData = {
  type: "link";
  column_id: string;
  value: string | null;
  url: string | null;
};

type DataType =
  | StringData['type']
  | LinkData['type'];

export type AMRRecordField = StringData | LinkData;

export type AMRRecord = Array<AMRRecordField>;

export type AMRTableColumn = {
  id: string;
  type: DataType;
  label: string;
  sortable: boolean;
};

export type AMRRecordsResponse = {
  meta: {
    page: number;
    per_page: number;
    total_hits: number;
    columns: AMRTableColumn[];
  },
  data: AMRRecord[];
};