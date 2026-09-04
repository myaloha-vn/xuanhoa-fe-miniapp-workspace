import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card, CardHeader } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, DateRange } from "../../components/common/Filters";
import { SUGGESTIONS } from "../../data/mock";
import { fmtDate } from "../../utils/format";
import type { Suggestion, SuggestionStatus } from "../../types";

const STATUS_LABEL: Record<SuggestionStatus, string> = {
  pending: "Chờ tiếp nhận",
  done: "Đã xử lý",
};
const STATUS_STYLE: Record<SuggestionStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function SuggestionsList() {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => SUGGESTIONS.filter((s) => {
    if (q && !s.content.toLowerCase().includes(q.toLowerCase())) return false;
    if (from && new Date(s.createdAt) < new Date(from)) return false;
    if (to && new Date(s.createdAt) > new Date(`${to}T23:59:59`)) return false;
    return true;
  }), [q, from, to]);

  const columns: Column<Suggestion>[] = [
    {
      key: "content",
      header: "Nội dung góp ý",
      mobile: "title",
      render: (r) => <span className="line-clamp-2 max-w-[500px] inline-block">{r.content}</span>,
    },
    {
      key: "createdAt",
      header: "Ngày gửi",
      mobile: "meta",
      render: (r) => fmtDate(r.createdAt),
    },
    {
      key: "status",
      header: "Tình trạng",
      render: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[r.status]}`}>
          {STATUS_LABEL[r.status]}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader title="Danh sách góp ý của người dân" icon={<MessageCircle size={16} className="text-green-600" />} />
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Tìm theo nội dung..." />
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="Không có góp ý nào"
        emptyDescription="Thay đổi bộ lọc để xem thêm dữ liệu."
      />
    </Card>
  );
}
