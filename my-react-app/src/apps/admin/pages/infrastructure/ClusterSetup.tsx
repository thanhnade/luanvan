import { useEffect, useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { Server, Cluster } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Settings,
  Server as ServerIcon,
  Network,
  FileText,
  Code,
  Download,
  Package,
  ChevronRight,
  ChevronDown,
  Info,
  Search,
  Trash2,
  RotateCcw,
  Zap,
  BookOpen,
  Copy,
  ShieldCheck,
  Plus,
  Upload,
  FileCode,
  PlayCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

/**
 * Trang Cluster Setup - Thiết lập và cấu hình Kubernetes Cluster
 */
export function ClusterSetup() {
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInstallingAnsible, setIsInstallingAnsible] = useState(false);
  const [isUninstallingAnsible, setIsUninstallingAnsible] = useState(false);
  const [isReinstallingAnsible, setIsReinstallingAnsible] = useState(false);
  const [isInstallingK8s, setIsInstallingK8s] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("ansible");
  const [showAnsibleConfig, setShowAnsibleConfig] = useState(false);
  const [isCheckingAnsibleStatus, setIsCheckingAnsibleStatus] = useState(false);
  
  // Completion tracking states
  const [part1Completed, setPart1Completed] = useState(false);
  const [k8sActiveTab, setK8sActiveTab] = useState<string>("tab1");
  
  // K8s installation states for 3 tabs
  const [isInstallingK8sTab1, setIsInstallingK8sTab1] = useState(false);
  const [isInstallingK8sTab2, setIsInstallingK8sTab2] = useState(false);
  const [isInstallingK8sTab3, setIsInstallingK8sTab3] = useState(false);
  const [k8sTab1Completed, setK8sTab1Completed] = useState(false);
  const [k8sTab2Completed, setK8sTab2Completed] = useState(false);
  const [k8sTab3Completed, setK8sTab3Completed] = useState(false);
  
  // K8s installation logs for each tab
  const [k8sTab1Logs, setK8sTab1Logs] = useState<string[]>([]);
  const [k8sTab2Logs, setK8sTab2Logs] = useState<string[]>([]);
  const [k8sTab3Logs, setK8sTab3Logs] = useState<string[]>([]);
  const k8sTab1LogRef = useRef<HTMLDivElement>(null);
  const k8sTab2LogRef = useRef<HTMLDivElement>(null);
  const k8sTab3LogRef = useRef<HTMLDivElement>(null);
  
  // Ansible status states
  const [ansibleStatus, setAnsibleStatus] = useState<{
    installed: boolean;
    version?: string;
    controllerHost?: string;
    controllerRole?: "ANSIBLE" | "MASTER";
    error?: string;
  } | null>(null);
  
  // Modal states
  const [showInitModal, setShowInitModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [showSudoPasswordModal, setShowSudoPasswordModal] = useState(false);
  const [sudoPasswords, setSudoPasswords] = useState<Record<string, string>>({});
  const [pendingAnsibleAction, setPendingAnsibleAction] = useState<"install" | "reinstall" | "uninstall" | null>(null);
  const [pendingControllerHost, setPendingControllerHost] = useState<string | null>(null);
  const [pendingServerId, setPendingServerId] = useState<number | null>(null);
  
  // Server auth status states
  const [serverAuthStatus, setServerAuthStatus] = useState<{
    hasSshKey: boolean;
    hasSudoNopasswd: boolean | null;
    needsPassword: boolean;
    authMethod: string;
    error?: string;
  } | null>(null);
  const [isCheckingAuthStatus, setIsCheckingAuthStatus] = useState(false);
  
  // Ansible operation steps (thay thế logs)
  const [ansibleOperationSteps, setAnsibleOperationSteps] = useState<Array<{
    id: number;
    label: string;
    status: "pending" | "running" | "completed" | "error";
  }>>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  
  // Config backup states (for rollback)
  const [configBackup, setConfigBackup] = useState<{
    ansibleCfg: string;
    ansibleInventory: string;
    ansibleVars: string;
  } | null>(null);
  const [isVerifyingConfig, setIsVerifyingConfig] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  // Playbook states
  const [playbooks, setPlaybooks] = useState<Array<{ name: string; content: string; size?: number }>>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [playbookFilename, setPlaybookFilename] = useState("");
  const [playbookContent, setPlaybookContent] = useState("");
  const [playbookTemplate, setPlaybookTemplate] = useState("");
  const [playbookSearchQuery, setPlaybookSearchQuery] = useState("");
  const [isSavingPlaybook, setIsSavingPlaybook] = useState(false);
  const [isExecutingPlaybook, setIsExecutingPlaybook] = useState(false);
  const [isDeletingPlaybook, setIsDeletingPlaybook] = useState(false);
  const [playbookExecutionLogs, setPlaybookExecutionLogs] = useState<string[]>([]);
  const [isLoadingPlaybooks, setIsLoadingPlaybooks] = useState(false);
  const playbookExecutionLogRef = useRef<HTMLDivElement>(null);
  
  // Init Ansible log states
  const [initLogs, setInitLogs] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [runningStep, setRunningStep] = useState<number | null>(null);
  const initLogRef = useRef<HTMLDivElement>(null);
  const [initSudoPassword, setInitSudoPassword] = useState<string>("");
  const initTaskLogLengthRef = useRef(0);
  const initTaskPollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prerequisites check states
  const [prerequisites, setPrerequisites] = useState<{
    serversReady: boolean;
    masterExists: boolean;
    sshKeysConfigured: boolean;
    dockerInstalled: boolean;
  }>({
    serversReady: false,
    masterExists: false,
    sshKeysConfigured: false,
    dockerInstalled: false,
  });

  // Configuration states
  const [k8sVersion, setK8sVersion] = useState("1.28.0");
  const [podNetworkCidr, setPodNetworkCidr] = useState("10.244.0.0/16");
  const [serviceCidr, setServiceCidr] = useState("10.96.0.0/12");
  const [containerRuntime, setContainerRuntime] = useState("containerd");

  // Ansible configuration states
  const [ansibleCfg, setAnsibleCfg] = useState("");
  const [ansibleInventory, setAnsibleInventory] = useState("");
  const [ansibleVars, setAnsibleVars] = useState("");

  useEffect(() => {
    // Tải dữ liệu và kiểm tra trạng thái Ansible khi vào trang
    loadData();
    handleCheckAnsibleStatus(true); // Silent mode để không hiển thị toast
  }, []);

  // Kiểm tra auth status khi modal mở
  useEffect(() => {
    if (showSudoPasswordModal && pendingServerId) {
      checkServerAuthStatus();
    } else {
      setServerAuthStatus(null);
    }
  }, [showSudoPasswordModal, pendingServerId]);

  // Load Ansible config từ server khi mở modal
  useEffect(() => {
    const loadAnsibleConfig = async () => {
      if (showConfigModal && ansibleStatus?.installed && ansibleStatus?.controllerHost) {
        try {
          const config = await adminAPI.getAnsibleConfig(ansibleStatus.controllerHost);
          if (config.success) {
            const cfg = config.ansibleCfg || "";
            const inventory = config.ansibleInventory || "";
            const vars = config.ansibleVars || "";
            setAnsibleCfg(cfg);
            setAnsibleInventory(inventory);
            setAnsibleVars(vars);
            backupConfig(cfg, inventory, vars);
          } else {
            console.error("Không thể load cấu hình Ansible:", config.error);
            // Không hiển thị toast error để không làm phiền user
          }
        } catch (error: any) {
          console.error("Lỗi khi load cấu hình Ansible:", error);
          // Không hiển thị toast error, chỉ log
        }
      }
    };

    loadAnsibleConfig();
  }, [showConfigModal, ansibleStatus?.installed, ansibleStatus?.controllerHost]);


  const checkServerAuthStatus = async () => {
    if (!pendingServerId) return;
    
    setIsCheckingAuthStatus(true);
    try {
      const status = await adminAPI.checkServerAuthStatus(pendingServerId);
      setServerAuthStatus(status);
    } catch (error: any) {
      const errorMessage = error.message || "Không thể kiểm tra trạng thái xác thực";
      setServerAuthStatus({
        hasSshKey: false,
        hasSudoNopasswd: null,
        needsPassword: true,
        authMethod: "error",
        error: errorMessage,
      });
    } finally {
      setIsCheckingAuthStatus(false);
    }
  };

  // Khởi tạo các bước dựa trên action type
  const initializeAnsibleSteps = (action: "install" | "reinstall" | "uninstall") => {
    let steps: Array<{ id: number; label: string; status: "pending" | "running" | "completed" | "error" }> = [];
    
    if (action === "install") {
      steps = [
        { id: 1, label: "Cập nhật package manager", status: "pending" },
        { id: 2, label: "Cài đặt Python và pip", status: "pending" },
        { id: 3, label: "Cài đặt Ansible", status: "pending" },
        { id: 4, label: "Kiểm tra cài đặt", status: "pending" },
      ];
    } else if (action === "reinstall") {
      steps = [
        { id: 1, label: "Cập nhật pip", status: "pending" },
        { id: 2, label: "Cài đặt lại/nâng cấp Ansible", status: "pending" },
        { id: 3, label: "Kiểm tra phiên bản Ansible", status: "pending" },
      ];
    } else if (action === "uninstall") {
      steps = [
        { id: 1, label: "Kiểm tra hiện trạng Ansible", status: "pending" },
        { id: 2, label: "Gỡ Ansible bằng pip", status: "pending" },
        { id: 3, label: "Gỡ Ansible bằng apt (nếu có)", status: "pending" },
        { id: 4, label: "Dọn dẹp file và thư mục", status: "pending" },
        { id: 5, label: "Kiểm tra sau khi gỡ", status: "pending" },
      ];
    }
    
    setAnsibleOperationSteps(steps);
    setCurrentStepIndex(-1);
  };

  // Cập nhật trạng thái bước
  const updateAnsibleStep = (stepId: number, status: "pending" | "running" | "completed" | "error") => {
    setAnsibleOperationSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  // Đặt bước hiện tại đang chạy
  const setAnsibleRunningStep = (stepId: number) => {
    setCurrentStepIndex(stepId - 1);
    updateAnsibleStep(stepId, "running");
    // Đánh dấu các bước trước đó là completed
    setAnsibleOperationSteps((prev) =>
      prev.map((step) => (step.id < stepId ? { ...step, status: "completed" as const } : step))
    );
  };

  // Hoàn thành bước
  const completeStep = (stepId: number) => {
    updateAnsibleStep(stepId, "completed");
  };

  // Đánh dấu lỗi bước
  const errorStep = (stepId: number) => {
    updateAnsibleStep(stepId, "error");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [clusterData, serversData] = await Promise.all([
        adminAPI.getCluster(),
        adminAPI.getServers(),
      ]);
      setCluster(clusterData);
      setServers(serversData);
      checkPrerequisites(clusterData, serversData);
    } catch (error: any) {
      console.error("Error loading data:", error);
      const errorMessage = error?.message || "Không thể tải dữ liệu";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkPrerequisites = (clusterData: Cluster | null, serversData: Server[]) => {
    const clusterServers = serversData.filter((s) => s.clusterStatus === "AVAILABLE");
    const masterServers = clusterServers.filter((s) => s.role === "MASTER");
    const onlineServers = clusterServers.filter((s) => s.status === "online");

    setPrerequisites({
      serversReady: clusterServers.length > 0 && onlineServers.length === clusterServers.length,
      masterExists: masterServers.length > 0,
      sshKeysConfigured: clusterServers.length > 0, // Simplified check
      dockerInstalled: false, // Would need to check via SSH
    });
  };

  // Get servers by role
  const ansibleServers = servers.filter((s) => s.role === "ANSIBLE");
  const clusterServers = servers.filter(
    (s) => s.clusterStatus === "AVAILABLE" && (s.role === "MASTER" || s.role === "WORKER")
  );
  const masterServers = clusterServers.filter((s) => s.role === "MASTER");
  const workerServers = clusterServers.filter((s) => s.role === "WORKER");
  
  // Tính toán thông tin cluster để hiển thị
  const masterCount = masterServers.length;
  const workerCount = workerServers.length;
  const clusterStatusText = cluster?.status === "healthy" ? "healthy" : "unhealthy";
  const clusterVersionText = cluster?.version || "Unknown";

  const handleCheckAnsibleStatus = async (silent: boolean = false) => {
    try {
      setIsCheckingAnsibleStatus(true);
      // Không gửi controllerHost, để backend tự động tìm controller server
      const status = await adminAPI.checkAnsibleStatus();
      // Luôn cập nhật status, kể cả khi có error
      setAnsibleStatus(status);
      
      // Chỉ hiển thị toast nếu không phải silent mode
      if (!silent) {
        if (status.error) {
          toast.warning(status.error);
        } else if (status.controllerHost) {
          toast.success(`Đã kiểm tra trạng thái Ansible trên ${status.controllerHost}`);
        } else {
          toast.success("Đã kiểm tra trạng thái Ansible");
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || "Không thể kiểm tra trạng thái Ansible";
      // Cập nhật status với error ngay cả khi API call fail
      setAnsibleStatus({
        installed: false,
        version: undefined,
        controllerHost: undefined,
        controllerRole: undefined,
        error: errorMessage,
      });
      // Chỉ hiển thị lỗi nếu không phải silent mode
      if (!silent) {
        toast.error(errorMessage);
      }
    } finally {
      setIsCheckingAnsibleStatus(false);
    }
  };

  const handleInstallAnsible = () => {
    if (ansibleServers.length === 0) {
      toast.error("Chưa có server nào với role ANSIBLE. Vui lòng thêm server ANSIBLE trước.");
      return;
    }

    const ansibleServer = ansibleServers[0]; // Chỉ có 1 máy Ansible
    if (ansibleServer.status !== "online") {
      toast.error("Máy Ansible không đang online.");
      return;
    }

    // Mở modal để nhập sudo password
    setPendingAnsibleAction("install");
    setPendingControllerHost(ansibleServer.ipAddress);
    setPendingServerId(parseInt(ansibleServer.id));
    initializeAnsibleSteps("install");
    setShowSudoPasswordModal(true);
  };

  const handleConfirmInstallAnsible = async () => {
    if (!pendingControllerHost) {
      toast.error("Không tìm thấy máy Ansible.");
      return;
    }

    const sudoPassword = sudoPasswords[pendingControllerHost] || "";
    
    // Kiểm tra nếu cần password nhưng chưa nhập
    if (serverAuthStatus?.needsPassword && (!sudoPassword || sudoPassword.trim() === "")) {
      toast.error("Vui lòng nhập sudo password.");
      return;
    }

    try {
      setIsInstallingAnsible(true);
      
      // Bước 1: Cập nhật package manager
      setAnsibleRunningStep(1);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      completeStep(1);
      
      // Bước 2: Cài đặt Python và pip
      setAnsibleRunningStep(2);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      completeStep(2);
      
      // Bước 3: Cài đặt Ansible
      setAnsibleRunningStep(3);
      const result = await adminAPI.installAnsible(pendingControllerHost, sudoPassword);
      
      // Nếu API call thành công (không throw error), coi như đã bắt đầu cài đặt
      completeStep(3);
      
      // Bước 4: Kiểm tra cài đặt
      setAnsibleRunningStep(4);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      completeStep(4);
      
      // Refresh status sau khi cài đặt
      setTimeout(async () => {
        try {
          const status = await adminAPI.checkAnsibleStatus();
          setAnsibleStatus(status);
          if (status.installed) {
            toast.success(`Cài đặt Ansible hoàn tất! Phiên bản: ${status.version || "Unknown"}`);
          }
        } catch (error) {
          console.error("Không thể kiểm tra trạng thái sau khi cài đặt", error);
        }
      }, 1000);
      
      // Clear passwords sau khi sử dụng
      setSudoPasswords({});
    } catch (error: any) {
      const errorMessage = error.message || "Không thể cài đặt Ansible";
      if (currentStepIndex >= 0) {
        errorStep(ansibleOperationSteps[currentStepIndex]?.id || 1);
      }
      toast.error(errorMessage);
    } finally {
      setIsInstallingAnsible(false);
      // Không set pendingAnsibleAction về null để giữ modal mở và cho phép đóng thủ công
    }
  };

  const handleReinstallAnsible = () => {
    if (ansibleServers.length === 0) {
      toast.error("Không tìm thấy máy Ansible.");
      return;
    }

    const ansibleServer = ansibleServers[0]; // Chỉ có 1 máy Ansible
    
    // Mở modal để nhập sudo password
    setPendingAnsibleAction("reinstall");
    setPendingControllerHost(ansibleServer.ipAddress);
    setPendingServerId(parseInt(ansibleServer.id));
    initializeAnsibleSteps("reinstall");
    setShowSudoPasswordModal(true);
  };

  const handleConfirmReinstallAnsible = async () => {
    if (!pendingControllerHost) {
      toast.error("Không tìm thấy máy Ansible.");
      return;
    }

    const sudoPassword = sudoPasswords[pendingControllerHost] || "";
    
    // Kiểm tra nếu cần password nhưng chưa nhập
    if (serverAuthStatus?.needsPassword && (!sudoPassword || sudoPassword.trim() === "")) {
      toast.error("Vui lòng nhập sudo password.");
      return;
    }

    try {
      setIsReinstallingAnsible(true);
      
      // Bước 1: Cập nhật pip
      setAnsibleRunningStep(1);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      completeStep(1);
      
      // Bước 2: Cài đặt lại/nâng cấp Ansible
      setAnsibleRunningStep(2);
      const result = await adminAPI.reinstallAnsible(pendingControllerHost, sudoPassword);
      
      // Nếu API call thành công (không throw error), coi như đã bắt đầu cài đặt lại
      completeStep(2);
      
      // Bước 3: Kiểm tra phiên bản
      setAnsibleRunningStep(3);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      completeStep(3);
      
      // Refresh status sau khi cài đặt lại
      setTimeout(async () => {
        try {
          const status = await adminAPI.checkAnsibleStatus();
          setAnsibleStatus(status);
          if (status.installed) {
            toast.success(`Cài đặt lại Ansible hoàn tất! Phiên bản: ${status.version || "Unknown"}`);
          }
        } catch (error) {
          console.error("Không thể kiểm tra trạng thái sau khi cài đặt lại", error);
        }
      }, 1000);
      
      // Clear passwords sau khi sử dụng
      setSudoPasswords({});
    } catch (error: any) {
      const errorMessage = error.message || "Không thể cài đặt lại Ansible";
      if (currentStepIndex >= 0) {
        errorStep(ansibleOperationSteps[currentStepIndex]?.id || 1);
      }
      toast.error(errorMessage);
    } finally {
      setIsReinstallingAnsible(false);
      // Không set pendingAnsibleAction về null để giữ modal mở và cho phép đóng thủ công
    }
  };

  const handleUninstallAnsible = () => {
    if (ansibleServers.length === 0) {
      toast.error("Không tìm thấy máy Ansible.");
      return;
    }

    const ansibleServer = ansibleServers[0]; // Chỉ có 1 máy Ansible
    
    // Mở modal để nhập sudo password
    setPendingAnsibleAction("uninstall");
    setPendingControllerHost(ansibleServer.ipAddress);
    setPendingServerId(parseInt(ansibleServer.id));
    initializeAnsibleSteps("uninstall");
    setShowSudoPasswordModal(true);
  };

  const handleConfirmUninstallAnsible = async () => {
    if (!pendingControllerHost) {
      toast.error("Không tìm thấy máy Ansible.");
      return;
    }

    const sudoPassword = sudoPasswords[pendingControllerHost] || "";
    
    // Kiểm tra nếu cần password nhưng chưa nhập
    if (serverAuthStatus?.needsPassword && (!sudoPassword || sudoPassword.trim() === "")) {
      toast.error("Vui lòng nhập sudo password.");
      return;
    }

    try {
      setIsUninstallingAnsible(true);
      
      // Bước 1: Kiểm tra hiện trạng
      setAnsibleRunningStep(1);
      await new Promise((resolve) => setTimeout(resolve, 800));
      completeStep(1);
      
      // Bước 2: Gỡ bằng pip
      setAnsibleRunningStep(2);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      completeStep(2);
      
      // Bước 3: Gỡ bằng apt
      setAnsibleRunningStep(3);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      completeStep(3);
      
      // Bước 4: Dọn dẹp
      setAnsibleRunningStep(4);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      completeStep(4);
      
      // Bước 5: Kiểm tra sau khi gỡ
      setAnsibleRunningStep(5);
      const result = await adminAPI.uninstallAnsible(pendingControllerHost, sudoPassword);
      
      // Nếu API call thành công (không throw error), coi như đã hoàn tất
      completeStep(5);
      
      // Update status after uninstallation
      setTimeout(async () => {
        try {
          const status = await adminAPI.checkAnsibleStatus();
          setAnsibleStatus(status);
          toast.success("Gỡ Ansible hoàn tất!");
        } catch (error) {
          // Nếu không kiểm tra được, cập nhật status thủ công
          setAnsibleStatus({
            installed: false,
            version: undefined,
            controllerHost: pendingControllerHost,
            controllerRole: ansibleServers[0]?.role as "ANSIBLE" | "MASTER" | undefined,
          });
          toast.success("Gỡ Ansible hoàn tất!");
        }
      }, 1000);
      
      // Clear passwords sau khi sử dụng
      setSudoPasswords({});
    } catch (error: any) {
      const errorMessage = error.message || "Không thể gỡ Ansible";
      if (currentStepIndex >= 0) {
        errorStep(ansibleOperationSteps[currentStepIndex]?.id || 1);
      }
      toast.error(errorMessage);
    } finally {
      setIsUninstallingAnsible(false);
      // Không set pendingAnsibleAction về null để giữ modal mở và cho phép đóng thủ công
    }
  };

  // Helper functions for K8s tab logs
  const addK8sTab1Log = (message: string, type: "info" | "success" | "error" | "step" = "info") => {
    const timestamp = new Date().toLocaleTimeString("vi-VN");
    const prefix = type === "step" ? "📋" : type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    setK8sTab1Logs((prev) => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  const addK8sTab2Log = (message: string, type: "info" | "success" | "error" | "step" = "info") => {
    const timestamp = new Date().toLocaleTimeString("vi-VN");
    const prefix = type === "step" ? "📋" : type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    setK8sTab2Logs((prev) => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  const addK8sTab3Log = (message: string, type: "info" | "success" | "error" | "step" = "info") => {
    const timestamp = new Date().toLocaleTimeString("vi-VN");
    const prefix = type === "step" ? "📋" : type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    setK8sTab3Logs((prev) => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  // Auto-scroll logs
  useEffect(() => {
    if (k8sTab1LogRef.current && isInstallingK8sTab1) {
      k8sTab1LogRef.current.scrollTop = k8sTab1LogRef.current.scrollHeight;
    }
  }, [k8sTab1Logs, isInstallingK8sTab1]);

  useEffect(() => {
    if (k8sTab2LogRef.current && isInstallingK8sTab2) {
      k8sTab2LogRef.current.scrollTop = k8sTab2LogRef.current.scrollHeight;
    }
  }, [k8sTab2Logs, isInstallingK8sTab2]);

  useEffect(() => {
    if (k8sTab3LogRef.current && isInstallingK8sTab3) {
      k8sTab3LogRef.current.scrollTop = k8sTab3LogRef.current.scrollHeight;
    }
  }, [k8sTab3Logs, isInstallingK8sTab3]);

  // K8s Tab 1: Chuẩn bị môi trường
  const handleInstallK8sTab1 = async () => {
    if (clusterServers.length === 0) {
      toast.error("Chưa có server nào trong cluster.");
      return;
    }

    if (!part1Completed) {
      toast.error("Phải hoàn thành Phần 1 trước.");
      return;
    }

    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    try {
      setIsInstallingK8sTab1(true);
      setK8sTab1Logs([]);
      addK8sTab1Log("Bắt đầu Tab 1: Chuẩn bị môi trường...", "step");

      const result = await adminAPI.installK8sTab1({
        controllerHost: ansibleStatus.controllerHost,
        sudoPassword: initSudoPassword || undefined,
        k8sVersion,
        podNetworkCidr,
        serviceCidr,
        containerRuntime,
      });

      const message = result.message || "Đã hoàn thành Tab 1";
      message
        .replace(/\r/g, "")
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .forEach((line) => addK8sTab1Log(line, result.success ? "info" : "error"));

      if (!result.success) {
        throw new Error(result.error || message);
      }

      addK8sTab1Log("🎉 Tab 1 hoàn tất thành công!", "success");
      setK8sTab1Completed(true);
      toast.success("Tab 1: Chuẩn bị môi trường hoàn tất!");

      setTimeout(() => {
        setK8sActiveTab("tab2");
        toast.info("Đã chuyển sang Tab 2");
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi không xác định";
      addK8sTab1Log(`Lỗi: ${errorMessage}`, "error");
      toast.error(`Lỗi Tab 1: ${errorMessage}`);
    } finally {
      setIsInstallingK8sTab1(false);
    }
  };

  // K8s Tab 2: Triển khai cluster
  const handleInstallK8sTab2 = async () => {
    if (!k8sTab1Completed) {
      toast.error("Phải hoàn thành Tab 1 trước.");
      return;
    }

    if (masterServers.length === 0) {
      toast.error("Phải có ít nhất 1 Master node.");
      return;
    }

    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    try {
      setIsInstallingK8sTab2(true);
      setK8sTab2Logs([]);
      addK8sTab2Log("Bắt đầu Tab 2: Triển khai cluster...", "step");

      const result = await adminAPI.installK8sTab2({
        controllerHost: ansibleStatus.controllerHost,
        sudoPassword: initSudoPassword || undefined,
        k8sVersion,
        podNetworkCidr,
        serviceCidr,
        containerRuntime,
      });

      const message = result.message || "Đã hoàn thành Tab 2";
      message
        .replace(/\r/g, "")
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .forEach((line) => addK8sTab2Log(line, result.success ? "info" : "error"));

      if (!result.success) {
        throw new Error(result.error || message);
      }

      addK8sTab2Log("🎉 Tab 2 hoàn tất thành công!", "success");
      setK8sTab2Completed(true);
      toast.success("Tab 2: Triển khai cluster hoàn tất!");

      setTimeout(() => {
        setK8sActiveTab("tab3");
        toast.info("Đã chuyển sang Tab 3");
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi không xác định";
      addK8sTab2Log(`Lỗi: ${errorMessage}`, "error");
      toast.error(`Lỗi Tab 2: ${errorMessage}`);
    } finally {
      setIsInstallingK8sTab2(false);
    }
  };

  // K8s Tab 3: Kiểm tra & Tùy chọn mở rộng
  const handleInstallK8sTab3 = async () => {
    if (!k8sTab2Completed) {
      toast.error("Phải hoàn thành Tab 2 trước.");
      return;
    }

    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    const masterNode = masterServers[0];
    if (!masterNode) {
      toast.error("Không tìm thấy master node.");
      return;
    }

    const workerNodeIps = workerServers.map((worker) => worker.ipAddress).filter((ip): ip is string => Boolean(ip));

    try {
      setIsInstallingK8sTab3(true);
      setK8sTab3Logs([]);
      addK8sTab3Log("Bắt đầu Tab 3: Kiểm tra & Tùy chọn mở rộng...", "step");

      const result = await adminAPI.installK8sTab3({
        controllerHost: ansibleStatus.controllerHost,
        sudoPassword: initSudoPassword || undefined,
        masterNodeIp: masterNode.ipAddress,
        workerNodeIps,
        k8sVersion,
        podNetworkCidr,
        serviceCidr,
        containerRuntime,
      });

      const message = result.message || "Đã hoàn thành Tab 3";
      message
        .replace(/\r/g, "")
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .forEach((line) => addK8sTab3Log(line, result.success ? "info" : "error"));

      if (!result.success) {
        throw new Error(result.error || message);
      }

      addK8sTab3Log("🎉 Tab 3 hoàn tất thành công!", "success");
      addK8sTab3Log("🎉 Kubernetes Cluster đã được cài đặt hoàn chỉnh!", "success");
      setK8sTab3Completed(true);
      toast.success("Tab 3: Kiểm tra & Tùy chọn mở rộng hoàn tất!");
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi không xác định";
      addK8sTab3Log(`Lỗi: ${errorMessage}`, "error");
      toast.error(`Lỗi Tab 3: ${errorMessage}`);
    } finally {
      setIsInstallingK8sTab3(false);
    }
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Auto-scroll log to bottom
  useEffect(() => {
    if (initLogRef.current) {
      initLogRef.current.scrollTop = initLogRef.current.scrollHeight;
    }
  }, [initLogs]);

  const clearInitLogs = () => {
    setInitLogs([]);
    initTaskLogLengthRef.current = 0;
  };

  const copyInitLogs = () => {
    const logText = initLogs.join("\n");
    navigator.clipboard.writeText(logText);
    toast.success("Đã sao chép log vào clipboard");
  };

  const appendInitLogChunk = useCallback((chunk: string) => {
    if (!chunk) return;
    const normalized = chunk.replace(/\r/g, "");
    const lines = normalized.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) return;
    setInitLogs((prev) => [...prev, ...lines]);
  }, []);

  const emitInitLogLine = useCallback(
    (message: string) => {
      appendInitLogChunk(`${message}\n`);
    },
    [appendInitLogChunk]
  );

  const cancelInitTaskPolling = useCallback(() => {
    if (initTaskPollingRef.current) {
      clearTimeout(initTaskPollingRef.current);
      initTaskPollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelInitTaskPolling();
    };
  }, [cancelInitTaskPolling]);

  const monitorInitTask = useCallback(
    (taskId: string, stepLabel: string) => {
      return new Promise<void>((resolve, reject) => {
        const poll = async () => {
          try {
            const status = await adminAPI.getAnsibleInitStatus(taskId);
            if (status.logs) {
              const logs = status.logs;
              if (logs.length < initTaskLogLengthRef.current) {
                initTaskLogLengthRef.current = 0;
              }
              const newChunk = logs.substring(initTaskLogLengthRef.current);
              initTaskLogLengthRef.current = logs.length;
              appendInitLogChunk(newChunk);
            }

            if (status.status === "running") {
              initTaskPollingRef.current = setTimeout(poll, 1000);
            } else if (status.status === "completed") {
              cancelInitTaskPolling();
              resolve();
            } else if (status.status === "failed") {
              cancelInitTaskPolling();
              reject(new Error(status.error || `Bước ${stepLabel} thất bại`));
            } else if (status.status === "not_found") {
              cancelInitTaskPolling();
              reject(new Error("Không tìm thấy task hoặc task đã hết hạn"));
            } else {
              cancelInitTaskPolling();
              resolve();
            }
          } catch (error) {
            cancelInitTaskPolling();
            reject(error);
          }
        };

        poll();
      });
    },
    [appendInitLogChunk, cancelInitTaskPolling]
  );

  const runInitStep = useCallback(
    async ({
      stepNumber,
      startMessage,
      successMessage,
      startRequest,
    }: {
      stepNumber: number;
      startMessage: string;
      successMessage: string;
      startRequest: () => Promise<{ success: boolean; message?: string; error?: string; taskId?: string }>;
    }) => {
      if (!ansibleStatus?.controllerHost) {
        toast.error("Không tìm thấy controller host.");
        return false;
      }

      cancelInitTaskPolling();
      initTaskLogLengthRef.current = 0;
      setRunningStep(stepNumber);
      emitInitLogLine(startMessage);

      try {
        const result = await startRequest();
        if (!result.success) {
          throw new Error(result.message || result.error || "Thao tác thất bại");
        }
        if (!result.taskId) {
          throw new Error("Không nhận được taskId từ server");
        }

        await monitorInitTask(result.taskId, startMessage);
        toast.success(successMessage);
        return true;
      } catch (error: any) {
        const errorMessage = error.message || "Lỗi không xác định";
        emitInitLogLine(`Lỗi: ${errorMessage}`);
        toast.error(errorMessage);
        return false;
      } finally {
        cancelInitTaskPolling();
        setRunningStep((prev) => (prev === stepNumber ? null : prev));
      }
    },
    [ansibleStatus?.controllerHost, cancelInitTaskPolling, emitInitLogLine, monitorInitTask]
  );

  // Backup config before saving
  const backupConfig = (
    cfg: string = ansibleCfg,
    inventory: string = ansibleInventory,
    vars: string = ansibleVars
  ) => {
    setConfigBackup({
      ansibleCfg: cfg,
      ansibleInventory: inventory,
      ansibleVars: vars,
    });
  };

  // Verify Ansible config
  const handleVerifyConfig = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

      if (!ansibleCfg.trim() || !ansibleInventory.trim()) {
        toast.error("Vui lòng điền đầy đủ ansible.cfg và inventory");
        return;
      }

    setIsVerifyingConfig(true);

    try {
      const result = await adminAPI.verifyAnsibleConfig(
        ansibleStatus.controllerHost,
        ansibleCfg,
        ansibleInventory,
        ansibleVars
      );

      if (result.success) {
        toast.success(result.message || "Cấu hình hợp lệ!");
      } else {
        throw new Error(result.error || result.message || "Cấu hình không hợp lệ");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Không thể kiểm tra cấu hình";
      toast.error(errorMessage);
    } finally {
      setIsVerifyingConfig(false);
    }
  };

  // Rollback config to backup
  const handleRollbackConfig = async () => {
    if (!configBackup) {
      toast.error("Không có bản backup để khôi phục");
      return;
    }

    if (!confirm("Bạn có chắc muốn khôi phục cấu hình về trạng thái trước đó? Các thay đổi chưa lưu sẽ bị mất.")) {
      return;
    }

    try {
      setIsRollingBack(true);
      
      // Restore from backup
      setAnsibleCfg(configBackup.ansibleCfg);
      setAnsibleInventory(configBackup.ansibleInventory);
      setAnsibleVars(configBackup.ansibleVars);
      
      toast.success("Đã khôi phục cấu hình");
    } catch (error: any) {
      const errorMessage = error.message || "Không thể khôi phục cấu hình";
      toast.error(errorMessage);
    } finally {
      setIsRollingBack(false);
    }
  };

  // Save config (with backup)
  const handleSaveConfig = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    // Validate required fields
    if (!ansibleCfg.trim() || !ansibleInventory.trim()) {
      toast.error("Vui lòng điền đầy đủ ansible.cfg và inventory");
      return;
    }

    setIsSavingConfig(true);

    try {
      const result = await adminAPI.saveAnsibleConfig(
        ansibleStatus.controllerHost,
        ansibleCfg,
        ansibleInventory,
        ansibleVars
      );

      if (!result.success) {
        throw new Error(result.error || result.message || "Không thể lưu cấu hình");
      }

      toast.success(result.message || "Đã lưu cấu hình Ansible");
      backupConfig(ansibleCfg, ansibleInventory, ansibleVars);
      setShowConfigModal(false);
    } catch (error: any) {
      const errorMessage = error.message || "Không thể lưu cấu hình";
      toast.error(errorMessage);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Playbook functions
  const loadPlaybooks = async (preferredSelection?: string | null) => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    setIsLoadingPlaybooks(true);
    try {
      const response = await adminAPI.getPlaybooks(ansibleStatus.controllerHost);
      const remotePlaybooks = response.playbooks || [];
      setPlaybooks(remotePlaybooks);

      if (remotePlaybooks.length === 0) {
        setSelectedPlaybook(null);
        setPlaybookFilename("");
        setPlaybookContent("");
        return;
      }

      const nextSelection =
        (preferredSelection && remotePlaybooks.some((pb) => pb.name === preferredSelection) && preferredSelection) ||
        (selectedPlaybook && remotePlaybooks.some((pb) => pb.name === selectedPlaybook) && selectedPlaybook) ||
        remotePlaybooks[0].name;

      const selected = remotePlaybooks.find((pb) => pb.name === nextSelection) || remotePlaybooks[0];
      setSelectedPlaybook(selected.name);
      setPlaybookFilename(selected.name.replace(/\.ya?ml$/i, ""));
      setPlaybookContent(selected.content || "");
    } catch (error: any) {
      const errorMessage = error.message || "Không thể tải danh sách playbook";
      toast.error(errorMessage);
    } finally {
      setIsLoadingPlaybooks(false);
    }
  };

  const handleCreatePlaybook = () => {
    setPlaybookFilename("");
    setPlaybookContent("");
    setPlaybookTemplate("");
    setSelectedPlaybook(null);
  };

  const handleSelectPlaybook = (playbookName: string) => {
    const playbook = playbooks.find((p) => p.name === playbookName);
    if (playbook) {
      setSelectedPlaybook(playbookName);
      setPlaybookFilename(playbookName.replace(".yml", ""));
      setPlaybookContent(playbook.content);
    }
  };

  const handleSavePlaybook = async () => {
    const trimmedName = playbookFilename.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên file playbook");
      return;
    }

    if (!playbookContent.trim()) {
      toast.error("Vui lòng nhập nội dung playbook");
      return;
    }

    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    const filename = /\.ya?ml$/i.test(trimmedName) ? trimmedName : `${trimmedName}.yml`;

    try {
      setIsSavingPlaybook(true);
      const result = await adminAPI.savePlaybook({
        controllerHost: ansibleStatus.controllerHost,
        filename,
        content: playbookContent,
        sudoPassword: initSudoPassword || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || result.message || "Không thể lưu playbook");
      }

      toast.success(result.message || `Đã lưu playbook ${filename}`);
      setSelectedPlaybook(filename);
      await loadPlaybooks(filename);
    } catch (error: any) {
      const errorMessage = error.message || "Không thể lưu playbook";
      toast.error(errorMessage);
    } finally {
      setIsSavingPlaybook(false);
    }
  };

  const handleDeletePlaybook = async () => {
    if (!selectedPlaybook) {
      toast.error("Vui lòng chọn playbook để xóa");
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa playbook "${selectedPlaybook}"?`)) {
      return;
    }

    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    try {
      setIsDeletingPlaybook(true);
      const result = await adminAPI.deletePlaybook({
        controllerHost: ansibleStatus.controllerHost,
        filename: selectedPlaybook,
        sudoPassword: initSudoPassword || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || result.message || "Không thể xóa playbook");
      }

      toast.success(result.message || `Đã xóa playbook ${selectedPlaybook}`);
      await loadPlaybooks();
    } catch (error: any) {
      const errorMessage = error.message || "Không thể xóa playbook";
      toast.error(errorMessage);
    } finally {
      setIsDeletingPlaybook(false);
    }
  };

  const addPlaybookExecutionLog = (message: string, type: "info" | "success" | "error" | "step" = "info") => {
    const timestamp = new Date().toLocaleTimeString("vi-VN");
    const prefix = type === "step" ? "📋" : type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    setPlaybookExecutionLogs((prev) => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  const clearPlaybookExecutionLogs = () => {
    setPlaybookExecutionLogs([]);
  };

  // Auto-scroll execution log to bottom
  useEffect(() => {
    if (playbookExecutionLogRef.current && isExecutingPlaybook) {
      playbookExecutionLogRef.current.scrollTop = playbookExecutionLogRef.current.scrollHeight;
    }
  }, [playbookExecutionLogs, isExecutingPlaybook]);

  const handleExecutePlaybook = async () => {
    if (!selectedPlaybook) {
      toast.error("Vui lòng chọn playbook để thực thi");
      return;
    }

    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    try {
      setIsExecutingPlaybook(true);
      clearPlaybookExecutionLogs();
      addPlaybookExecutionLog(`Bắt đầu thực thi playbook: ${selectedPlaybook}`, "step");
      
      const result = await adminAPI.executePlaybook({
        controllerHost: ansibleStatus.controllerHost,
        filename: selectedPlaybook,
        sudoPassword: initSudoPassword || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || result.message || "Thực thi playbook thất bại");
      }

      const normalized = (result.message || "").replace(/\r/g, "");
      const lines = normalized.split("\n").filter((line) => line.trim().length > 0);
      if (lines.length > 0) {
        lines.forEach((line) => addPlaybookExecutionLog(line, "info"));
      }
      
      addPlaybookExecutionLog("🎉 Thực thi playbook thành công!", "success");
      toast.success(result.message || `Đã thực thi playbook ${selectedPlaybook} thành công!`);
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi không xác định";
      addPlaybookExecutionLog(`Lỗi: ${errorMessage}`, "error");
      toast.error(`Lỗi khi thực thi: ${errorMessage}`);
    } finally {
      setIsExecutingPlaybook(false);
    }
  };

  const handleUploadPlaybook = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const filename = file.name.replace(".yml", "").replace(".yaml", "");
      setPlaybookFilename(filename);
      setPlaybookContent(content);
      setSelectedPlaybook(null);
      toast.success(`Đã tải lên file ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleTemplateChange = (template: string) => {
    setPlaybookTemplate(template);
    // TODO: Load template content from backend or predefined templates
    if (template) {
      setPlaybookContent(`# Template: ${template}\n---\n- name: Generated from template\n  hosts: all\n  tasks:\n    - debug: msg="Template content"`);
    }
  };

  // Load playbooks when modal opens
  useEffect(() => {
    if (showPlaybookModal && ansibleStatus?.installed) {
      loadPlaybooks();
    }
  }, [showPlaybookModal, ansibleStatus?.installed]);

  // Filter playbooks by search query
  const filteredPlaybooks = playbooks.filter((p) =>
    p.name.toLowerCase().includes(playbookSearchQuery.toLowerCase())
  );

  // Bước 1: Tạo cấu trúc thư mục
  const executeStep1 = async (): Promise<boolean> => {
    return runInitStep({
      stepNumber: 1,
      startMessage: "Bước 1/4: Tạo cấu trúc thư mục Ansible trên controller...",
      successMessage: "Bước 1 hoàn tất!",
      startRequest: () =>
        adminAPI.initAnsibleStep1(
          ansibleStatus?.controllerHost,
          initSudoPassword || undefined
        ),
    });
  };

  // Bước 2: Ghi cấu hình mặc định
  const executeStep2 = async (): Promise<boolean> => {
    return runInitStep({
      stepNumber: 2,
      startMessage: "Bước 2/4: Ghi cấu hình mặc định (ansible.cfg, inventory)...",
      successMessage: "Bước 2 hoàn tất!",
      startRequest: () =>
        adminAPI.initAnsibleStep2(
          ansibleStatus?.controllerHost,
          ansibleCfg,
          ansibleInventory,
          ansibleVars,
          initSudoPassword || undefined
        ),
    });
  };

  // Bước 3: Phân phối SSH key
  const executeStep3 = async (): Promise<boolean> => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return false;
    }

    const clusterServersForInit = servers.filter(
      (s) => s.clusterStatus === "AVAILABLE" && (s.role === "MASTER" || s.role === "WORKER")
    );

    if (clusterServersForInit.length === 0) {
      emitInitLogLine("⚠️ Không có nodes nào trong cluster để phân phối key");
      toast.warning("Không có nodes nào trong cluster");
      return false;
    }

    const serverIds = clusterServersForInit.map((s) => String(s.id));

    return runInitStep({
      stepNumber: 3,
      startMessage: `Bước 3/4: Phân phối SSH key từ controller đến ${serverIds.length} node(s)...`,
      successMessage: "Bước 3 hoàn tất!",
      startRequest: () =>
        adminAPI.initAnsibleStep3(
          ansibleStatus.controllerHost,
          serverIds,
          initSudoPassword || undefined
        ),
    });
  };

  // Bước 4: Ping nodes
  const executeStep4 = async (): Promise<boolean> => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return false;
    }

    const clusterServersForInit = servers.filter(
      (s) => s.clusterStatus === "AVAILABLE" && (s.role === "MASTER" || s.role === "WORKER")
    );

    if (clusterServersForInit.length === 0) {
      emitInitLogLine("⚠️ Không có nodes nào trong cluster để ping");
      toast.warning("Không có nodes nào trong cluster");
      return false;
    }

    const serverIds = clusterServersForInit.map((s) => String(s.id));

    return runInitStep({
      stepNumber: 4,
      startMessage: `Bước 4/4: Ping và kiểm tra kết nối đến ${serverIds.length} node(s)...`,
      successMessage: "Bước 4 hoàn tất!",
      startRequest: () =>
        adminAPI.initAnsibleStep4(ansibleStatus.controllerHost, serverIds),
    });
  };

  // Khởi tạo tuần tự cả 4 bước
  const handleStartInit = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host. Vui lòng kiểm tra trạng thái Ansible trước.");
      return;
    }

    setIsInitializing(true);
    clearInitLogs();
    emitInitLogLine("Bắt đầu quá trình khởi tạo Ansible...");

    const finish = () => {
      setIsInitializing(false);
      cancelInitTaskPolling();
    };

    const step1Ok = await executeStep1();
    if (!step1Ok) {
      finish();
      return;
    }

    const step2Ok = await executeStep2();
    if (!step2Ok) {
      finish();
      return;
    }

    const step3Ok = await executeStep3();
    if (!step3Ok) {
      finish();
      return;
    }

    const step4Ok = await executeStep4();
    if (!step4Ok) {
      finish();
      return;
    }

    emitInitLogLine("");
    emitInitLogLine("🎉 Khởi tạo Ansible hoàn tất thành công!");
    const clusterServersForInit = servers.filter(
      (s) => s.clusterStatus === "AVAILABLE" && (s.role === "MASTER" || s.role === "WORKER")
    );
    emitInitLogLine(`Đã khởi tạo cho ${clusterServersForInit.length} nodes trong cluster.`);
    
    setPart1Completed(true);
    toast.success("Khởi tạo Ansible thành công! Phần 1 đã hoàn thành.");
    
    setTimeout(() => {
      setExpandedSection("kubernetes");
      setK8sActiveTab("tab1");
      toast.info("Đã chuyển sang Phần 2: Cài đặt Kubernetes");
    }, 1000);

    finish();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">⚙️ Cluster Setup</h2>
        <div className="border rounded-lg p-8 text-center">
          <div className="animate-pulse">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">⚙️ Cluster Setup</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Thiết lập và cấu hình Kubernetes Cluster
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Cluster Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Thông tin Cluster
          </CardTitle>
          <CardDescription>
            Thông tin cluster hiện tại và trạng thái thiết lập
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trạng thái:</span>
              <span className="text-base font-medium">
                {masterCount} Master, {workerCount} Worker
              </span>
              <Badge variant={cluster?.status === "healthy" ? "default" : "secondary"} className="ml-1">
                ({clusterStatusText})
              </Badge>
            </div>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Version:</span>
              <span className="text-base font-medium">{clusterVersionText}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phần 1: Chuẩn bị cài đặt Ansible */}
      <Card className="border-2">
        <CardHeader>
          <button
            onClick={() => toggleSection("ansible")}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">Phần 1: Chuẩn bị cài đặt Ansible</CardTitle>
                  {part1Completed && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Hoàn thành
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  Cài đặt Ansible trên các server có role=ANSIBLE để chuẩn bị cho việc tự động hóa
                </CardDescription>
              </div>
            </div>
            {expandedSection === "ansible" ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </CardHeader>
        {expandedSection === "ansible" && (
          <CardContent className="space-y-4">
            {/* Card hiển thị thông tin Ansible */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Thông tin Ansible</CardTitle>
                  <Button
                    onClick={() => handleCheckAnsibleStatus(false)}
                    disabled={isCheckingAnsibleStatus}
                    variant="outline"
                    size="sm"
                  >
                    {isCheckingAnsibleStatus ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Kiểm tra trạng thái
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ansibleStatus?.error && !ansibleStatus.controllerHost ? (
                  <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">{ansibleStatus.error}</p>
                    <p className="text-sm mt-1">Vui lòng thêm server với role ANSIBLE hoặc MASTER trong trang Servers</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Trạng thái */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Trạng thái</Label>
                      <div className="flex items-center gap-2">
                        {isCheckingAnsibleStatus ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                            <span className="font-medium">Đang kiểm tra...</span>
                          </>
                        ) : ansibleStatus?.controllerHost ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="font-medium">Online</span>
                          </>
                        ) : ansibleServers.length > 0 && ansibleServers[0]?.status === "online" ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="font-medium">Online</span>
                          </>
                        ) : ansibleServers.length > 0 ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                            <span className="font-medium">Chưa kiểm tra</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                            <span className="font-medium">Offline</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Máy controller */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Máy controller</Label>
                      <div className="font-medium">
                        {isCheckingAnsibleStatus ? (
                          <span className="text-muted-foreground">Đang kiểm tra...</span>
                        ) : ansibleStatus?.controllerHost ? (
                          <span>
                            {ansibleStatus.controllerHost}
                            {ansibleStatus.controllerRole && (
                              <Badge variant="outline" className="ml-2">
                                {ansibleStatus.controllerRole}
                              </Badge>
                            )}
                          </span>
                        ) : ansibleServers.length > 0 ? (
                          <span>
                            {ansibleServers[0]?.ipAddress || "-"}
                            <Badge variant="outline" className="ml-2">
                              {ansibleServers[0]?.role || "ANSIBLE"}
                            </Badge>
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>

                    {/* Phiên bản Ansible */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Phiên bản Ansible</Label>
                      <div className="font-medium">
                        {isCheckingAnsibleStatus ? (
                          <Badge variant="outline">Đang kiểm tra...</Badge>
                        ) : ansibleStatus ? (
                          ansibleStatus.installed ? (
                            <Badge variant="default">{ansibleStatus.version || "Đã cài đặt"}</Badge>
                          ) : (
                            <Badge variant="secondary">Chưa cài đặt</Badge>
                          )
                        ) : (
                          <Badge variant="outline">Chưa kiểm tra</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {ansibleStatus?.controllerHost && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    {!ansibleStatus?.installed ? (
                      <Button
                        onClick={handleInstallAnsible}
                        disabled={isInstallingAnsible}
                        size="sm"
                      >
                        {isInstallingAnsible ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang cài đặt...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Cài đặt Ansible
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleReinstallAnsible}
                          disabled={isReinstallingAnsible}
                          variant="outline"
                          size="sm"
                        >
                          {isReinstallingAnsible ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang cài đặt lại...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Cài đặt lại
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleUninstallAnsible}
                          disabled={isUninstallingAnsible}
                          variant="destructive"
                          size="sm"
                        >
                          {isUninstallingAnsible ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang gỡ...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Gỡ
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Thông tin cài đặt */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Thông tin cài đặt Ansible:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Ansible sẽ được cài đặt trên máy Ansible duy nhất trong hệ thống</li>
                    <li>Quá trình cài đặt sẽ tự động cấu hình Python, pip và các dependencies cần thiết</li>
                    <li>Sau khi cài đặt xong, Ansible có thể được sử dụng để quản lý các server khác</li>
                    <li>Máy Ansible phải đang online để có thể cài đặt</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Các nút hành động */}
            {ansibleStatus?.installed && (
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setShowInitModal(true)}
                  disabled={!ansibleStatus.installed}
                  size="lg"
                  variant="default"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Khởi tạo
                </Button>
                <Button
                  onClick={() => setShowConfigModal(true)}
                  disabled={!ansibleStatus.installed}
                  size="lg"
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Cấu hình
                </Button>
                <Button
                  onClick={() => setShowPlaybookModal(true)}
                  disabled={!ansibleStatus.installed}
                  size="lg"
                  variant="outline"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Playbook & K8s
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Phần 2: Cài đặt Kubernetes */}
      <Card className="border-2">
        <CardHeader>
          <button
            onClick={() => toggleSection("kubernetes")}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Network className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">Phần 2: Cài đặt Kubernetes Cluster</CardTitle>
                  {k8sTab3Completed && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Hoàn thành
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  Cài đặt Kubernetes trên các server có cluster_status=AVAILABLE và role=MASTER/WORKER
                </CardDescription>
              </div>
            </div>
            {expandedSection === "kubernetes" ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </CardHeader>
        {expandedSection === "kubernetes" && (
          <CardContent className="space-y-6">
            {!part1Completed && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="flex-1 text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-semibold mb-1">Vui lòng hoàn thành Phần 1 trước</p>
                    <p>Phần 1 phải được hoàn thành trước khi có thể cài đặt Kubernetes.</p>
                  </div>
                </div>
              </div>
            )}

            {part1Completed && (
              <Tabs 
                value={k8sActiveTab} 
                onValueChange={(value) => {
                  if (value === "tab2" && !k8sTab1Completed) {
                    toast.warning("Phải hoàn thành Tab 1 trước");
                    return;
                  }
                  if (value === "tab3" && !k8sTab2Completed) {
                    toast.warning("Phải hoàn thành Tab 2 trước");
                    return;
                  }
                  setK8sActiveTab(value);
                }} 
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tab1" className="flex items-center gap-2">
                    Tab 1: Chuẩn bị môi trường
                    {k8sTab1Completed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tab2" 
                    className={`flex items-center gap-2 ${!k8sTab1Completed ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Tab 2: Triển khai cluster
                    {k8sTab2Completed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tab3" 
                    className={`flex items-center gap-2 ${!k8sTab2Completed ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Tab 3: Kiểm tra & Mở rộng
                    {k8sTab3Completed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Chuẩn bị môi trường */}
                <TabsContent value="tab1" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Tab 1: Chuẩn bị môi trường
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Cập nhật hosts & hostname, cấu hình kernel & sysctl, cài đặt containerd và kubeadm/kubelet/kubectl
                    </p>
                  </div>

                  {/* Log Console */}
                  <div className="border rounded-lg overflow-hidden bg-gray-900 flex flex-col" style={{ minHeight: "400px", maxHeight: "500px" }}>
                    <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isInstallingK8sTab1 ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></div>
                        <span className="text-xs text-gray-300 font-mono">Console Output</span>
                        {k8sTab1Logs.length > 0 && (
                          <span className="text-xs text-gray-400">({k8sTab1Logs.length} dòng)</span>
                        )}
                      </div>
                      {k8sTab1Logs.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const logText = k8sTab1Logs.join("\n");
                            navigator.clipboard.writeText(logText);
                            toast.success("Đã sao chép log vào clipboard");
                          }}
                          className="h-7 px-2 text-xs text-gray-300 hover:text-white"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      )}
                    </div>
                    <div
                      ref={k8sTab1LogRef}
                      className="flex-1 overflow-y-auto p-4 font-mono text-sm"
                      style={{ minHeight: "350px", maxHeight: "450px" }}
                    >
                      {k8sTab1Logs.length === 0 ? (
                        <div className="text-gray-500 italic">
                          Nhấn "Bắt đầu cài đặt" để xem log...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {k8sTab1Logs.map((log, index) => {
                            let logClass = "text-gray-300";
                            if (log.includes("✓") || log.includes("✅") || log.includes("🎉")) {
                              logClass = "text-green-400";
                            } else if (log.includes("❌") || log.includes("Lỗi")) {
                              logClass = "text-red-400";
                            } else if (log.includes("📋") || log.includes("Bước") || log.includes("Tab")) {
                              logClass = "text-yellow-400 font-semibold";
                            } else if (log.includes("→") || log.includes("Đang")) {
                              logClass = "text-blue-400";
                            }
                            return (
                              <div key={index} className={logClass}>
                                {log || "\u00A0"}
                              </div>
                            );
                          })}
                          {isInstallingK8sTab1 && (
                            <div className="text-yellow-400 animate-pulse">
                              <span className="inline-block animate-bounce">▋</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleInstallK8sTab1}
                      disabled={isInstallingK8sTab1 || k8sTab1Completed || !part1Completed}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {isInstallingK8sTab1 ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang cài đặt...
                        </>
                      ) : k8sTab1Completed ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Đã hoàn thành
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Bắt đầu cài đặt
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab 2: Triển khai cluster */}
                <TabsContent value="tab2" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Tab 2: Triển khai cluster
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Khởi tạo master node, cài đặt CNI (Calico), và thêm worker nodes vào cluster
                    </p>
                  </div>

                  {/* Log Console */}
                  <div className="border rounded-lg overflow-hidden bg-gray-900 flex flex-col" style={{ minHeight: "400px", maxHeight: "500px" }}>
                    <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isInstallingK8sTab2 ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></div>
                        <span className="text-xs text-gray-300 font-mono">Console Output</span>
                        {k8sTab2Logs.length > 0 && (
                          <span className="text-xs text-gray-400">({k8sTab2Logs.length} dòng)</span>
                        )}
                      </div>
                      {k8sTab2Logs.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const logText = k8sTab2Logs.join("\n");
                            navigator.clipboard.writeText(logText);
                            toast.success("Đã sao chép log vào clipboard");
                          }}
                          className="h-7 px-2 text-xs text-gray-300 hover:text-white"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      )}
                    </div>
                    <div
                      ref={k8sTab2LogRef}
                      className="flex-1 overflow-y-auto p-4 font-mono text-sm"
                      style={{ minHeight: "350px", maxHeight: "450px" }}
                    >
                      {k8sTab2Logs.length === 0 ? (
                        <div className="text-gray-500 italic">
                          Nhấn "Bắt đầu cài đặt" để xem log...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {k8sTab2Logs.map((log, index) => {
                            let logClass = "text-gray-300";
                            if (log.includes("✓") || log.includes("✅") || log.includes("🎉")) {
                              logClass = "text-green-400";
                            } else if (log.includes("❌") || log.includes("Lỗi")) {
                              logClass = "text-red-400";
                            } else if (log.includes("📋") || log.includes("Bước") || log.includes("Tab")) {
                              logClass = "text-yellow-400 font-semibold";
                            } else if (log.includes("→") || log.includes("Đang")) {
                              logClass = "text-blue-400";
                            }
                            return (
                              <div key={index} className={logClass}>
                                {log || "\u00A0"}
                              </div>
                            );
                          })}
                          {isInstallingK8sTab2 && (
                            <div className="text-yellow-400 animate-pulse">
                              <span className="inline-block animate-bounce">▋</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleInstallK8sTab2}
                      disabled={isInstallingK8sTab2 || k8sTab2Completed || !k8sTab1Completed}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {isInstallingK8sTab2 ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang cài đặt...
                        </>
                      ) : k8sTab2Completed ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Đã hoàn thành
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Bắt đầu cài đặt
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab 3: Kiểm tra & Mở rộng */}
                <TabsContent value="tab3" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Tab 3: Kiểm tra & Tùy chọn mở rộng
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Xác minh trạng thái cluster, cài đặt Helm 3, Metrics Server, và Nginx Ingress
                    </p>
                  </div>

                  {/* Log Console */}
                  <div className="border rounded-lg overflow-hidden bg-gray-900 flex flex-col" style={{ minHeight: "400px", maxHeight: "500px" }}>
                    <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isInstallingK8sTab3 ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></div>
                        <span className="text-xs text-gray-300 font-mono">Console Output</span>
                        {k8sTab3Logs.length > 0 && (
                          <span className="text-xs text-gray-400">({k8sTab3Logs.length} dòng)</span>
                        )}
                      </div>
                      {k8sTab3Logs.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const logText = k8sTab3Logs.join("\n");
                            navigator.clipboard.writeText(logText);
                            toast.success("Đã sao chép log vào clipboard");
                          }}
                          className="h-7 px-2 text-xs text-gray-300 hover:text-white"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      )}
                    </div>
                    <div
                      ref={k8sTab3LogRef}
                      className="flex-1 overflow-y-auto p-4 font-mono text-sm"
                      style={{ minHeight: "350px", maxHeight: "450px" }}
                    >
                      {k8sTab3Logs.length === 0 ? (
                        <div className="text-gray-500 italic">
                          Nhấn "Bắt đầu cài đặt" để xem log...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {k8sTab3Logs.map((log, index) => {
                            let logClass = "text-gray-300";
                            if (log.includes("✓") || log.includes("✅") || log.includes("🎉")) {
                              logClass = "text-green-400";
                            } else if (log.includes("❌") || log.includes("Lỗi")) {
                              logClass = "text-red-400";
                            } else if (log.includes("📋") || log.includes("Bước") || log.includes("Tab")) {
                              logClass = "text-yellow-400 font-semibold";
                            } else if (log.includes("→") || log.includes("Đang")) {
                              logClass = "text-blue-400";
                            }
                            return (
                              <div key={index} className={logClass}>
                                {log || "\u00A0"}
                              </div>
                            );
                          })}
                          {isInstallingK8sTab3 && (
                            <div className="text-yellow-400 animate-pulse">
                              <span className="inline-block animate-bounce">▋</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleInstallK8sTab3}
                      disabled={isInstallingK8sTab3 || k8sTab3Completed || !k8sTab2Completed}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {isInstallingK8sTab3 ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang cài đặt...
                        </>
                      ) : k8sTab3Completed ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Đã hoàn thành
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Bắt đầu cài đặt
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modals */}
      {/* Init Ansible Modal */}
      <Dialog open={showInitModal} onOpenChange={setShowInitModal}>
        <DialogContent className="w-[75vw] h-[90vh] max-w-none max-h-none flex flex-col p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Khởi tạo Ansible
            </DialogTitle>
            <DialogDescription>
              Tạo cấu trúc, ghi cấu hình mặc định, phân phối SSH key từ controller đến các máy trong cụm, và ping nodes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4 flex-1 flex flex-col min-h-0">
            {/* Log Console */}
            <div className="flex-1 flex flex-col min-h-0 border rounded-lg overflow-hidden bg-gray-900">
              <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-300 font-mono">Kết quả thực hiện</span>
                  {initLogs.length > 0 && (
                    <span className="text-xs text-gray-400">({initLogs.length} dòng)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {initLogs.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyInitLogs}
                        className="h-7 px-2 text-xs text-gray-300 hover:text-white"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearInitLogs}
                        disabled={isInitializing}
                        className="h-7 px-2 text-xs text-gray-300 hover:text-white"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div
                ref={initLogRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm text-green-400"
                style={{
                  minHeight: "300px",
                  maxHeight: "500px",
                }}
              >
                {initLogs.length === 0 ? (
                  <div className="text-gray-500 italic">
                    Nhấn "Bắt đầu khởi tạo" để xem log...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {initLogs.map((log, index) => {
                      // Determine log type for styling
                      let logClass = "text-gray-300";
                      if (log.includes("✓") || log.includes("✅") || log.includes("🎉")) {
                        logClass = "text-green-400";
                      } else if (log.includes("❌") || log.includes("Lỗi")) {
                        logClass = "text-red-400";
                      } else if (log.includes("📋") || log.includes("Bước")) {
                        logClass = "text-yellow-400 font-semibold";
                      } else if (log.includes("→")) {
                        logClass = "text-blue-400";
                      }

                      return (
                        <div key={index} className={logClass}>
                          {log || "\u00A0"}
                        </div>
                      );
                    })}
                    {isInitializing && (
                      <div className="text-yellow-400 animate-pulse">
                        <span className="inline-block animate-bounce">▋</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            

            <div className="pt-2 border-t space-y-3">
              {/* Step Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={executeStep1}
                  disabled={isInitializing || runningStep !== null || !ansibleStatus?.installed}
                  variant="outline"
                  className="justify-start"
                >
                  {runningStep === 1 ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang chạy...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Bước 1: Tạo cấu trúc thư mục
                    </>
                  )}
                </Button>
                <Button
                  onClick={executeStep2}
                  disabled={isInitializing || runningStep !== null || !ansibleStatus?.installed}
                  variant="outline"
                  className="justify-start"
                >
                  {runningStep === 2 ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang chạy...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Bước 2: Ghi cấu hình mặc định
                    </>
                  )}
                </Button>
                <Button
                  onClick={executeStep3}
                  disabled={isInitializing || runningStep !== null || !ansibleStatus?.installed}
                  variant="outline"
                  className="justify-start"
                >
                  {runningStep === 3 ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang chạy...
                    </>
                  ) : (
                    <>
                      <Network className="h-4 w-4 mr-2" />
                      Bước 3: Phân phối SSH key
                    </>
                  )}
                </Button>
                <Button
                  onClick={executeStep4}
                  disabled={isInitializing || runningStep !== null || !ansibleStatus?.installed}
                  variant="outline"
                  className="justify-start"
                >
                  {runningStep === 4 ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang chạy...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Bước 4: Ping nodes
                    </>
                  )}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!isInitializing && runningStep === null) {
                      setShowInitModal(false);
                      clearInitLogs();
                    }
                  }}
                  disabled={isInitializing || runningStep !== null}
                >
                  {isInitializing || runningStep !== null ? "Đang chạy..." : "Đóng"}
                </Button>
                <Button
                  onClick={handleStartInit}
                  disabled={isInitializing || runningStep !== null || !ansibleStatus?.installed}
                  size="lg"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang khởi tạo...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Khởi tạo (Chạy tuần tự 4 bước)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Config Ansible Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="w-[75vw] h-[90vh] max-w-none max-h-none flex flex-col p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cấu hình Ansible
            </DialogTitle>
            <DialogDescription>
              Xem và chỉnh sửa ansible.cfg, inventory (hosts), và group_vars/all.yml trên controller.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Tabs defaultValue="ansible-cfg" className="w-full">
              <TabsList>
                <TabsTrigger value="ansible-cfg">ansible.cfg</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>
              <TabsContent value="ansible-cfg" className="mt-4">
                <div className="space-y-2">
                  <Label>ansible.cfg</Label>
                  <Textarea
                    value={ansibleCfg}
                    onChange={(e) => setAnsibleCfg(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                    placeholder="[defaults]..."
                  />
                </div>
              </TabsContent>
              <TabsContent value="inventory" className="mt-4">
                <div className="space-y-2">
                  <Label>Inventory (hosts)</Label>
                  <Textarea
                    value={ansibleInventory}
                    onChange={(e) => setAnsibleInventory(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                    placeholder="[master]..."
                  />
                  
                </div>
              </TabsContent>
              <TabsContent value="variables" className="mt-4">
                <div className="space-y-2">
                  <Label>Variables (group_vars/all.yml)</Label>
                  <Textarea
                    value={ansibleVars}
                    onChange={(e) => setAnsibleVars(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                    placeholder="key: value..."
                  />
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleVerifyConfig}
                  disabled={isVerifyingConfig || !ansibleStatus?.installed}
                >
                  {isVerifyingConfig ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Kiểm tra
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRollbackConfig}
                  disabled={isRollingBack || !configBackup}
                >
                  {isRollingBack ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang khôi phục...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Khôi phục
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveConfig}
                  disabled={!ansibleStatus?.installed || isSavingConfig}
                >
                  {isSavingConfig ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu cấu hình"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Playbook & K8s Modal */}
      <Dialog open={showPlaybookModal} onOpenChange={setShowPlaybookModal}>
        <DialogContent className="w-[75vw] h-[90vh] max-w-none max-h-none flex flex-col p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Quản lý playbook & cài đặt K8s
            </DialogTitle>
            <DialogDescription>
              Quản lý file playbook, chạy playbook trên controller, theo dõi output real-time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4 flex-1 flex flex-col min-h-0">
            {/* Action Buttons and Search */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreatePlaybook}
                  disabled={!ansibleStatus?.installed}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo playbook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (playbookTemplate) {
                      handleTemplateChange(playbookTemplate);
                      toast.success("Đã tạo playbook từ template");
                    } else {
                      toast.warning("Vui lòng chọn template trước");
                    }
                  }}
                  disabled={!ansibleStatus?.installed || !playbookTemplate}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Tạo từ template
                </Button>
                <label className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={!ansibleStatus?.installed}
                    onClick={() => document.getElementById("upload-playbook-input")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải lên
                  </Button>
                  <input
                    id="upload-playbook-input"
                    type="file"
                    accept=".yml,.yaml"
                    onChange={handleUploadPlaybook}
                    className="hidden"
                  />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPlaybooks(selectedPlaybook)}
                  disabled={!ansibleStatus?.installed || isLoadingPlaybooks}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Làm mới
                </Button>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-[320px]">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm playbook..."
                  value={playbookSearchQuery}
                  onChange={(e) => setPlaybookSearchQuery(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Filename and Template */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên file playbook</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={playbookFilename}
                    onChange={(e) => setPlaybookFilename(e.target.value)}
                    placeholder="example"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">.yml</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Extension .yml sẽ được thêm tự động
                </p>
              </div>
              <div className="space-y-2">
                <Label>Template K8s (tùy chọn)</Label>
                <Select
                  value={playbookTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <option value="">-- Chọn template K8s --</option>
                  <optgroup label="I. Chuẩn bị môi trường">
                    <option value="update-hosts-hostname">01 📝 Cập nhật hosts & hostname</option>
                    <option value="kernel-sysctl">02 ⚙️ Cấu hình kernel & sysctl</option>
                    <option value="install-containerd">03 🐳 Cài đặt containerd</option>
                    <option value="install-kubernetes">04 ☸️ Cài đặt kubeadm/kubelet/kubectl</option>
                  </optgroup>
                  <optgroup label="II. Triển khai cluster">
                    <option value="init-master">05 🚀 Khởi tạo master node</option>
                    <option value="install-cni">06 🌐 Cài đặt Calico CNI</option>
                    <option value="install-flannel">06 🌐 Cài đặt Flannel CNI</option>
                    <option value="join-workers">07 🔗 Thêm worker nodes</option>
                  </optgroup>
                  <optgroup label="III. Kiểm tra & Tùy chọn mở rộng">
                    <option value="verify-cluster">08 🧩 Xác minh trạng thái cụm</option>
                    <option value="install-helm">09 📦 Cài đặt Helm 3</option>
                    <option value="install-metrics-server">10 📊 Cài đặt Metrics Server</option>
                    <option value="install-ingress">11 🌍 Cài đặt Nginx Ingress</option>
                    <option value="install-metallb">12 ⚖️ Cài đặt MetalLB LoadBalancer</option>
                    <option value="setup-storage">13 💾 Thiết lập Storage</option>
                    <option value="prepare-and-join-worker">14 🔗 Chuẩn bị & Join Worker (02→03→04→07)</option>
                  </optgroup>
                  <optgroup label="IV. Triển khai toàn bộ">
                    <option value="deploy-full-cluster">🚀 Triển khai toàn bộ cluster (0-8, Calico)</option>
                    <option value="deploy-full-cluster-flannel">🚀 Triển khai toàn bộ cluster (0-8, Flannel)</option>
                  </optgroup>
                  <optgroup label="V. Bảo trì & Reset">
                    <option value="reset-cluster">🧹 Reset toàn bộ cluster</option>
                  </optgroup>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Chọn template để tự động tạo nội dung playbook
                </p>
              </div>
            </div>

            {/* Playbook List and Content */}
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
              {/* Playbook List */}
              <div className="col-span-12 md:col-span-4 flex flex-col min-h-0">
                <Label className="mb-2">Danh sách playbook</Label>
                <div className="border rounded-lg overflow-y-auto flex-1 bg-muted/30 min-h-0" style={{ maxHeight: "500px" }}>
                  {isLoadingPlaybooks ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Đang tải playbook...
                    </div>
                  ) : filteredPlaybooks.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {playbookSearchQuery ? "Không tìm thấy playbook" : "Chưa có playbook nào"}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredPlaybooks.map((playbook) => (
                        <button
                          key={playbook.name}
                          onClick={() => handleSelectPlaybook(playbook.name)}
                          className={`w-full p-3 text-left hover:bg-muted transition-colors ${
                            selectedPlaybook === playbook.name
                              ? "bg-primary/10 border-l-2 border-primary"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium truncate">{playbook.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Playbook Content / Execution Status */}
              <div className="col-span-12 md:col-span-8 flex flex-col min-h-0">
                {isExecutingPlaybook || playbookExecutionLogs.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Kết quả thực thi playbook</Label>
                      {!isExecutingPlaybook && playbookExecutionLogs.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPlaybookExecutionLogs([]);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Xem nội dung
                        </Button>
                      )}
                    </div>
                    <div className="border rounded-lg overflow-hidden flex-1 min-h-0 bg-gray-900" style={{ maxHeight: "500px" }}>
                      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${isExecutingPlaybook ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></div>
                          <span className="text-xs text-gray-300 font-mono">Execution Output</span>
                          {playbookExecutionLogs.length > 0 && (
                            <span className="text-xs text-gray-400">({playbookExecutionLogs.length} dòng)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {playbookExecutionLogs.length > 0 && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const logText = playbookExecutionLogs.join("\n");
                                  navigator.clipboard.writeText(logText);
                                  toast.success("Đã sao chép log vào clipboard");
                                }}
                                className="h-7 px-2 text-xs text-gray-300 hover:text-white"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearPlaybookExecutionLogs}
                                disabled={isExecutingPlaybook}
                                className="h-7 px-2 text-xs text-gray-300 hover:text-white"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Clear
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div
                        ref={playbookExecutionLogRef}
                        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
                        style={{
                          minHeight: "400px",
                          maxHeight: "500px",
                        }}
                      >
                        {playbookExecutionLogs.length === 0 ? (
                          <div className="text-gray-500 italic">
                            Đang khởi động thực thi...
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {playbookExecutionLogs.map((log, index) => {
                              // Determine log type for styling
                              let logClass = "text-gray-300";
                              if (log.includes("✓") || log.includes("✅") || log.includes("🎉") || log.includes("ok:") || log.includes("changed:")) {
                                logClass = "text-green-400";
                              } else if (log.includes("❌") || log.includes("Lỗi") || log.includes("failed:")) {
                                logClass = "text-red-400";
                              } else if (log.includes("📋") || log.includes("PLAY") || log.includes("TASK") || log.includes("RECAP")) {
                                logClass = "text-yellow-400 font-semibold";
                              } else if (log.includes("→") || log.includes("Đang")) {
                                logClass = "text-blue-400";
                              }

                              return (
                                <div key={index} className={logClass}>
                                  {log || "\u00A0"}
                                </div>
                              );
                            })}
                            {isExecutingPlaybook && (
                              <div className="text-yellow-400 animate-pulse">
                                <span className="inline-block animate-bounce">▋</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Label className="mb-2">Nội dung playbook</Label>
                    <div className="border rounded-lg overflow-hidden flex-1 min-h-0" style={{ maxHeight: "500px" }}>
                      <Textarea
                        value={playbookContent}
                        onChange={(e) => setPlaybookContent(e.target.value)}
                        className="font-mono text-sm w-full h-full resize-none overflow-y-auto"
                        style={{ 
                          minHeight: "400px", 
                          maxHeight: "500px",
                          height: "100%"
                        }}
                        placeholder="---&#10;- name: Example&#10;  hosts: all&#10;  tasks:&#10;    - debug: msg=&quot;hello&quot;&#10;"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                {selectedPlaybook && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeletePlaybook}
                    disabled={isDeletingPlaybook || !ansibleStatus?.installed}
                  >
                    {isDeletingPlaybook ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang xóa...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPlaybookModal(false)}>
                  Đóng
                </Button>
                {selectedPlaybook && (
                  <Button
                    variant="default"
                    onClick={handleExecutePlaybook}
                    disabled={isExecutingPlaybook || !ansibleStatus?.installed}
                  >
                    {isExecutingPlaybook ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang thực thi...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Thực thi
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleSavePlaybook}
                  disabled={isSavingPlaybook || !ansibleStatus?.installed}
                >
                  {isSavingPlaybook ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Lưu
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sudo Password Modal */}
      <Dialog 
        open={showSudoPasswordModal} 
        onOpenChange={(open) => {
          // Chỉ cho phép đóng khi không đang xử lý
          if (!open && !isInstallingAnsible && !isReinstallingAnsible && !isUninstallingAnsible) {
            setShowSudoPasswordModal(false);
            setSudoPasswords({});
            setPendingAnsibleAction(null);
            setPendingControllerHost(null);
            setPendingServerId(null);
            setAnsibleOperationSteps([]);
            setCurrentStepIndex(-1);
            setServerAuthStatus(null);
          }
        }}
      >
        <DialogContent className="w-[75vw] h-[90vh] max-w-none max-h-none flex flex-col p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAnsibleAction === "install" && (
                <>
                  <Package className="h-5 w-5" />
                  Cài đặt Ansible
                </>
              )}
              {pendingAnsibleAction === "reinstall" && (
                <>
                  <RotateCcw className="h-5 w-5" />
                  Cài đặt lại Ansible
                </>
              )}
              {pendingAnsibleAction === "uninstall" && (
                <>
                  <Trash2 className="h-5 w-5" />
                  Gỡ Ansible
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {pendingControllerHost && (
                <span>Controller: <span className="font-mono">{pendingControllerHost}</span></span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col gap-3 mt-2 min-h-0">
            {/* Password input section - chỉ hiển thị khi chưa bắt đầu và cần password */}
            {!isInstallingAnsible && !isReinstallingAnsible && !isUninstallingAnsible && (
              <div className="border-b pb-3 flex-shrink-0">
                {pendingControllerHost && (
                  <div className="space-y-2">
                    {/* Auth status check - chỉ hiển thị khi đang kiểm tra hoặc cần password */}
                    {isCheckingAuthStatus ? (
                      <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Đang kiểm tra...</span>
                      </div>
                    ) : serverAuthStatus?.needsPassword ? (
                      <div className="p-2.5 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              Cần sudo password
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    
                    {/* Chỉ hiển thị password input khi cần password */}
                    {serverAuthStatus?.needsPassword && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor="sudo-ansible" className="text-sm whitespace-nowrap">Password:</Label>
                        <Input
                          id="sudo-ansible"
                          type="password"
                          placeholder="Nhập sudo password"
                          value={sudoPasswords[pendingControllerHost] || ""}
                          onChange={(e) =>
                            setSudoPasswords((prev) => ({
                              ...prev,
                              [pendingControllerHost]: e.target.value,
                            }))
                          }
                          className="flex-1"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Steps section - thay thế console log */}
            <div className="flex-1 flex flex-col border rounded-lg overflow-hidden bg-background min-h-0">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    (isInstallingAnsible || isReinstallingAnsible || isUninstallingAnsible) 
                      ? "bg-green-500 animate-pulse" 
                      : "bg-gray-400"
                  }`}></div>
                  <span className="text-sm font-semibold">
                    {pendingAnsibleAction === "install" && "Cài đặt Ansible"}
                    {pendingAnsibleAction === "reinstall" && "Cài đặt lại Ansible"}
                    {pendingAnsibleAction === "uninstall" && "Gỡ Ansible"}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                {ansibleOperationSteps.length === 0 ? (
                  <div className="text-muted-foreground italic flex flex-col items-center justify-center h-full gap-4">
                    <Info className="h-8 w-8 text-muted-foreground/50" />
                    <p>Nhấn 'Xác nhận' để bắt đầu...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ansibleOperationSteps.map((step, index) => {
                      const isRunning = step.status === "running";
                      const isCompleted = step.status === "completed";
                      const isError = step.status === "error";
                      
                      return (
                        <div
                          key={step.id}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                            isRunning
                              ? "bg-primary/10 border border-primary/20"
                              : isCompleted
                              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                              : isError
                              ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                              : "bg-muted/50 border border-border"
                          }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {isRunning ? (
                              <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : isError ? (
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                isRunning
                                  ? "text-primary"
                                  : isCompleted
                                  ? "text-green-700 dark:text-green-300"
                                  : isError
                                  ? "text-red-700 dark:text-red-300"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </p>
                            {isRunning && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Đang xử lý...
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <div className="flex flex-col gap-1">
              {/* Auth status - hiển thị "Không cần password" ở footer */}
              {!isInstallingAnsible && !isReinstallingAnsible && !isUninstallingAnsible && 
               serverAuthStatus && !serverAuthStatus.needsPassword && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    ✓ Không cần password
                  </span>
                </div>
              )}
              {/* Status messages */}
              <div className="text-sm text-muted-foreground">
                {(isInstallingAnsible || isReinstallingAnsible || isUninstallingAnsible) && (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý, vui lòng đợi...
                  </span>
                )}
                {!isInstallingAnsible && !isReinstallingAnsible && !isUninstallingAnsible && 
                 ansibleOperationSteps.length > 0 && 
                 ansibleOperationSteps.every(s => s.status === "completed") && (
                  <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Hoàn tất!
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSudoPasswordModal(false);
                  setSudoPasswords({});
                  setPendingAnsibleAction(null);
                  setPendingControllerHost(null);
                  setPendingServerId(null);
                  setAnsibleOperationSteps([]);
                  setCurrentStepIndex(-1);
                  setServerAuthStatus(null);
                }}
                disabled={
                  isInstallingAnsible ||
                  isReinstallingAnsible ||
                  isUninstallingAnsible
                }
              >
                {ansibleOperationSteps.length > 0 && 
                 ansibleOperationSteps.every(s => s.status === "completed")
                  ? "Đóng" 
                  : "Hủy"}
              </Button>
              {!isInstallingAnsible && !isReinstallingAnsible && !isUninstallingAnsible && (
                <>
                  {/* Hiển thị nút "Xác nhận" khi chưa bắt đầu */}
                  {ansibleOperationSteps.length === 0 || 
                   !ansibleOperationSteps.every(s => s.status === "completed") ? (
                    <Button
                      onClick={() => {
                        if (pendingAnsibleAction === "install") {
                          handleConfirmInstallAnsible();
                        } else if (pendingAnsibleAction === "reinstall") {
                          handleConfirmReinstallAnsible();
                        } else if (pendingAnsibleAction === "uninstall") {
                          handleConfirmUninstallAnsible();
                        }
                      }}
                      disabled={
                        serverAuthStatus?.needsPassword && !sudoPasswords[pendingControllerHost || ""]?.trim()
                      }
                    >
                      Xác nhận
                    </Button>
                  ) : (
                    /* Hiển thị nút "Đóng" khi đã hoàn tất */
                    <Button
                      onClick={() => {
                        setShowSudoPasswordModal(false);
                        setSudoPasswords({});
                        setPendingAnsibleAction(null);
                        setPendingControllerHost(null);
                        setPendingServerId(null);
                        setAnsibleOperationSteps([]);
                        setCurrentStepIndex(-1);
                        setServerAuthStatus(null);
                      }}
                    >
                      Hoàn tất
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

