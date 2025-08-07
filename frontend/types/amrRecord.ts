export type StringData = {
  type: "string";
  id: string;
  value: string | null;
};

export type LinkData = {
  type: "link";
  id: string;
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