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

export type AMRRecordField = StringData | LinkData;

export type AMRRecord = Array<AMRRecordField>;


export type AMRRecordsResponse = {
  meta: {
    page: number;
    per_page: number;
    total_hits: number;
  },
  data: AMRRecord[];
}