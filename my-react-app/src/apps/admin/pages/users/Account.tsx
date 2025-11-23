import { useEffect, useMemo, useState } from "react";
import { adminAPI } from "@/lib/admin-api";
import type { AdminAccount } from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, ShieldCheck, Trash2, MoreVertical, UserX } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const statusVariant: Record<AdminAccount["status"], "success" | "warning" | "secondary"> = {
  active: "success",
  inactive: "secondary",
  pending: "warning",
};

export function Account() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getAdminAccounts();
        setAccounts(data);
        setFilteredAccounts(data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredAccounts(accounts);
    } else {
      const query = search.toLowerCase();
      setFilteredAccounts(
        accounts.filter(
          (acc) =>
            acc.name.toLowerCase().includes(query) ||
            acc.username.toLowerCase().includes(query) ||
            acc.email.toLowerCase().includes(query)
        )
      );
    }
  }, [search, accounts]);

  const handleResetPassword = async (account: AdminAccount) => {
    try {
      await adminAPI.resetAdminAccountPassword(account.id);
      toast.success(`Đã gửi email đặt lại mật khẩu cho ${account.name}`);
    } catch (error) {
      toast.error("Không thể reset mật khẩu");
    }
  };

  const handleToggleStatus = async (account: AdminAccount) => {
    try {
      const newStatus = account.status === "active" ? "inactive" : "active";
      await adminAPI.updateAdminAccountStatus(account.id, newStatus);
      toast.success(
        `Đã ${newStatus === "active" ? "kích hoạt" : "vô hiệu hóa"} tài khoản ${account.username}`
      );
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === account.id
            ? { ...acc, status: newStatus, lastLogin: newStatus === "active" ? new Date().toISOString() : acc.lastLogin }
            : acc
        )
      );
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleDeleteAccount = (account: AdminAccount) => {
    toast.info(`Đã gửi yêu cầu xóa tài khoản ${account.username}`);
  };

  const totalActive = useMemo(() => accounts.filter((acc) => acc.status === "active").length, [accounts]);
  const totalInactive = useMemo(() => accounts.filter((acc) => acc.status === "inactive").length, [accounts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải danh sách tài khoản...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Quản lý tài khoản</h1>
        <p className="text-sm text-muted-foreground">
          Duyệt danh sách tài khoản, kiểm soát trạng thái hoạt động và đặt lại mật khẩu.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{accounts.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-600">{totalActive}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang vô hiệu hóa</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-500">{totalInactive}</CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg">Danh sách tài khoản</CardTitle>
          <Input
            placeholder="Tìm theo tên, username, email..."
            className="md:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không tìm thấy tài khoản phù hợp.</p>
          ) : (
            <div className="space-y-3">
              {filteredAccounts.map((account) => (
                <Card key={account.id} className="border-muted bg-card/50">
                  <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-foreground">{account.name}</p>
                        <Badge variant={statusVariant[account.status]}>{account.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{account.username} • {account.email}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Role: <span className="text-foreground font-medium">{account.role}</span></span>
                        <span>Dịch vụ: <span className="text-foreground font-medium">{account.services}</span></span>
                        <span>Dự án: <span className="text-foreground font-medium">{account.projectCount}</span></span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tạo ngày {account.createdAt} • Lần cuối đăng nhập {account.lastLogin || "—"}
                      </p>
                    </div>
                    <DropdownMenu
                      trigger={
                        <Button variant="outline" className="ml-auto md:ml-0">
                          <MoreVertical className="mr-2 h-4 w-4" />
                          Thao tác
                        </Button>
                      }
                      align="right"
                    >
                      <DropdownMenuItem onClick={() => handleResetPassword(account)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset mật khẩu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(account)}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {account.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteAccount(account)}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Xóa tài khoản
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

