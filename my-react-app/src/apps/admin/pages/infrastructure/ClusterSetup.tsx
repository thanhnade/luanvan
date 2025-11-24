import { useEffect, useState, useRef } from "react";
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
  } | null>(null);
  
  // Modal states
  const [showInitModal, setShowInitModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  
  // Config backup states (for rollback)
  const [configBackup, setConfigBackup] = useState<{
    ansibleCfg: string;
    ansibleInventory: string;
    ansibleVars: string;
  } | null>(null);
  const [isVerifyingConfig, setIsVerifyingConfig] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  
  // Playbook states
  const [playbooks, setPlaybooks] = useState<Array<{ name: string; content: string }>>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [playbookFilename, setPlaybookFilename] = useState("");
  const [playbookContent, setPlaybookContent] = useState("");
  const [playbookTemplate, setPlaybookTemplate] = useState("");
  const [playbookSearchQuery, setPlaybookSearchQuery] = useState("");
  const [isSavingPlaybook, setIsSavingPlaybook] = useState(false);
  const [isExecutingPlaybook, setIsExecutingPlaybook] = useState(false);
  const [isDeletingPlaybook, setIsDeletingPlaybook] = useState(false);
  const [playbookExecutionLogs, setPlaybookExecutionLogs] = useState<string[]>([]);
  const playbookExecutionLogRef = useRef<HTMLDivElement>(null);
  
  // Init Ansible log states
  const [initLogs, setInitLogs] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [runningStep, setRunningStep] = useState<number | null>(null);
  const initLogRef = useRef<HTMLDivElement>(null);

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
  const [ansibleCfg, setAnsibleCfg] = useState(`[defaults]
inventory = /etc/ansible/hosts
host_key_checking = False
remote_user = root
private_key_file = ~/.ssh/id_rsa

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False`);

  const [ansibleInventory, setAnsibleInventory] = useState(`[master]
# Master nodes

[worker]
# Worker nodes

[all:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no'`);

  const [ansibleVars, setAnsibleVars] = useState(`# Kubernetes version
kube_version: "${k8sVersion}"

# Network configuration
pod_network_cidr: "${podNetworkCidr}"
service_cidr: "${serviceCidr}"

# Container runtime
container_runtime: "${containerRuntime}"

# Cluster configuration
cluster_name: "kubernetes-cluster"`);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Update ansible vars when config changes
    setAnsibleVars(`# Kubernetes version
kube_version: "${k8sVersion}"

# Network configuration
pod_network_cidr: "${podNetworkCidr}"
service_cidr: "${serviceCidr}"

# Container runtime
container_runtime: "${containerRuntime}"

# Cluster configuration
cluster_name: "kubernetes-cluster"`);
  }, [k8sVersion, podNetworkCidr, serviceCidr, containerRuntime]);

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
    } catch (error) {
      toast.error("Không thể tải dữ liệu");
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

  const handleCheckAnsibleStatus = async () => {
    if (ansibleServers.length === 0) {
      toast.error("Chưa có server nào với role ANSIBLE.");
      return;
    }

    try {
      setIsCheckingAnsibleStatus(true);
      // TODO: Call actual API endpoint for checking Ansible status
      // const status = await adminAPI.checkAnsibleStatus();
      
      // Simulate check - in real implementation, this would come from API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock status - replace with actual API response
      const mockStatus = {
        installed: false, // Change to true if Ansible is installed
        version: undefined,
        controllerHost: ansibleServers[0]?.ipAddress,
        controllerRole: "ANSIBLE" as const,
      };
      
      setAnsibleStatus(mockStatus);
      toast.success("Đã kiểm tra trạng thái Ansible");
    } catch (error: any) {
      const errorMessage = error.message || "Không thể kiểm tra trạng thái Ansible";
      toast.error(errorMessage);
    } finally {
      setIsCheckingAnsibleStatus(false);
    }
  };

  const handleInstallAnsible = async () => {
    if (ansibleServers.length === 0) {
      toast.error("Chưa có server nào với role ANSIBLE. Vui lòng thêm server ANSIBLE trước.");
      return;
    }

    const onlineAnsibleServers = ansibleServers.filter((s) => s.status === "online");
    if (onlineAnsibleServers.length === 0) {
      toast.error("Không có server ANSIBLE nào đang online.");
      return;
    }

    try {
      setIsInstallingAnsible(true);
      // TODO: Call actual API endpoint for Ansible installation
      // await adminAPI.installAnsible(ansibleServers.map(s => s.id));
      
      // Simulate installation process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.success(`Bắt đầu cài đặt Ansible trên ${onlineAnsibleServers.length} server...`);
      toast.info("Quá trình cài đặt có thể mất vài phút. Vui lòng kiểm tra logs.");
      
      // Update status after installation
      setAnsibleStatus({
        installed: true,
        version: "2.15.0", // Mock version
        controllerHost: onlineAnsibleServers[0]?.ipAddress,
        controllerRole: "ANSIBLE",
      });
    } catch (error: any) {
      const errorMessage = error.message || "Không thể cài đặt Ansible";
      toast.error(errorMessage);
    } finally {
      setIsInstallingAnsible(false);
    }
  };

  const handleReinstallAnsible = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    if (!confirm(`Bạn có chắc muốn cài đặt lại Ansible trên ${ansibleStatus.controllerHost}?`)) {
      return;
    }

    try {
      setIsReinstallingAnsible(true);
      // TODO: Call actual API endpoint for Ansible reinstallation
      // await adminAPI.reinstallAnsible(ansibleStatus.controllerHost);
      
      // Simulate reinstallation process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.success(`Đang cài đặt lại Ansible trên ${ansibleStatus.controllerHost}...`);
      toast.info("Quá trình cài đặt lại có thể mất vài phút.");
    } catch (error: any) {
      const errorMessage = error.message || "Không thể cài đặt lại Ansible";
      toast.error(errorMessage);
    } finally {
      setIsReinstallingAnsible(false);
    }
  };

  const handleUninstallAnsible = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    if (!confirm(`Bạn có chắc muốn gỡ Ansible khỏi ${ansibleStatus.controllerHost}?`)) {
      return;
    }

    try {
      setIsUninstallingAnsible(true);
      // TODO: Call actual API endpoint for Ansible uninstallation
      // await adminAPI.uninstallAnsible(ansibleStatus.controllerHost);
      
      // Simulate uninstallation process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.success(`Đang gỡ Ansible khỏi ${ansibleStatus.controllerHost}...`);
      
      // Update status after uninstallation
      setAnsibleStatus({
        installed: false,
        version: undefined,
        controllerHost: ansibleStatus.controllerHost,
        controllerRole: ansibleStatus.controllerRole,
      });
    } catch (error: any) {
      const errorMessage = error.message || "Không thể gỡ Ansible";
      toast.error(errorMessage);
    } finally {
      setIsUninstallingAnsible(false);
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

    try {
      setIsInstallingK8sTab1(true);
      setK8sTab1Logs([]);
      addK8sTab1Log("Bắt đầu Tab 1: Chuẩn bị môi trường...", "step");
      
      // TODO: Call actual API endpoint
      // await adminAPI.installK8sTab1({...});
      
      addK8sTab1Log("Đang cập nhật hosts & hostname...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addK8sTab1Log("✓ Đã cập nhật hosts & hostname", "success");
      
      addK8sTab1Log("Đang cấu hình kernel & sysctl...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addK8sTab1Log("✓ Đã cấu hình kernel & sysctl", "success");
      
      addK8sTab1Log("Đang cài đặt containerd...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      addK8sTab1Log("✓ Đã cài đặt containerd", "success");
      
      addK8sTab1Log("Đang cài đặt kubeadm/kubelet/kubectl...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      addK8sTab1Log("✓ Đã cài đặt kubeadm/kubelet/kubectl", "success");
      
      addK8sTab1Log("🎉 Tab 1 hoàn tất thành công!", "success");
      setK8sTab1Completed(true);
      toast.success("Tab 1: Chuẩn bị môi trường hoàn tất!");
      
      // Tự động chuyển sang tab 2
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

    try {
      setIsInstallingK8sTab2(true);
      setK8sTab2Logs([]);
      addK8sTab2Log("Bắt đầu Tab 2: Triển khai cluster...", "step");
      
      // TODO: Call actual API endpoint
      // await adminAPI.installK8sTab2({...});
      
      addK8sTab2Log("Đang khởi tạo master node...", "info");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      addK8sTab2Log("✓ Đã khởi tạo master node", "success");
      
      addK8sTab2Log("Đang cài đặt Calico CNI...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      addK8sTab2Log("✓ Đã cài đặt Calico CNI", "success");
      
      addK8sTab2Log("Đang thêm worker nodes...", "info");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      addK8sTab2Log("✓ Đã thêm worker nodes", "success");
      
      addK8sTab2Log("🎉 Tab 2 hoàn tất thành công!", "success");
      setK8sTab2Completed(true);
      toast.success("Tab 2: Triển khai cluster hoàn tất!");
      
      // Tự động chuyển sang tab 3
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

    try {
      setIsInstallingK8sTab3(true);
      setK8sTab3Logs([]);
      addK8sTab3Log("Bắt đầu Tab 3: Kiểm tra & Tùy chọn mở rộng...", "step");
      
      // TODO: Call actual API endpoint
      // await adminAPI.installK8sTab3({...});
      
      addK8sTab3Log("Đang xác minh trạng thái cluster...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addK8sTab3Log("✓ Cluster đang hoạt động tốt", "success");
      
      addK8sTab3Log("Đang cài đặt Helm 3...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addK8sTab3Log("✓ Đã cài đặt Helm 3", "success");
      
      addK8sTab3Log("Đang cài đặt Metrics Server...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addK8sTab3Log("✓ Đã cài đặt Metrics Server", "success");
      
      addK8sTab3Log("Đang cài đặt Nginx Ingress...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      addK8sTab3Log("✓ Đã cài đặt Nginx Ingress", "success");
      
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

  const addInitLog = (message: string, type: "info" | "success" | "error" | "step" = "info") => {
    const timestamp = new Date().toLocaleTimeString("vi-VN");
    const prefix = type === "step" ? "📋" : type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    setInitLogs((prev) => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  const clearInitLogs = () => {
    setInitLogs([]);
  };

  const copyInitLogs = () => {
    const logText = initLogs.join("\n");
    navigator.clipboard.writeText(logText);
    toast.success("Đã sao chép log vào clipboard");
  };

  // Backup config before saving
  const backupConfig = () => {
    setConfigBackup({
      ansibleCfg,
      ansibleInventory,
      ansibleVars,
    });
  };

  // Verify Ansible config
  const handleVerifyConfig = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    try {
      setIsVerifyingConfig(true);
      
      // Validate required fields
      if (!ansibleCfg.trim() || !ansibleInventory.trim()) {
        toast.error("Vui lòng điền đầy đủ ansible.cfg và inventory");
        return;
      }

      // TODO: Call actual API endpoint for config verification
      // const result = await adminAPI.verifyAnsibleConfig({
      //   ansibleCfg,
      //   ansibleInventory,
      //   ansibleVars,
      //   controllerHost: ansibleStatus.controllerHost,
      // });

      // Simulate verification process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock verification results
      const hasErrors = false;
      const errors: string[] = [];

      if (hasErrors) {
        toast.error(`Cấu hình có lỗi: ${errors.join(", ")}`);
      } else {
        toast.success("Cấu hình hợp lệ!");
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

    try {
      // Backup current config before saving
      backupConfig();

      // TODO: Call actual API endpoint to save config
      // await adminAPI.saveAnsibleConfig({
      //   ansibleCfg,
      //   ansibleInventory,
      //   ansibleVars,
      //   controllerHost: ansibleStatus.controllerHost,
      // });

      // Simulate save process
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success("Đã lưu cấu hình Ansible");
      setShowConfigModal(false);
    } catch (error: any) {
      const errorMessage = error.message || "Không thể lưu cấu hình";
      toast.error(errorMessage);
    }
  };

  // Playbook functions
  const loadPlaybooks = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    try {
      // TODO: Call actual API endpoint to load playbooks
      // const playbooksList = await adminAPI.getPlaybooks(ansibleStatus.controllerHost);
      
      // Mock data
      const mockPlaybooks = [
        { name: "cluster.yml", content: "---\n- name: Deploy Kubernetes Cluster\n  hosts: all\n  tasks: []" },
        { name: "prepare.yml", content: "---\n- name: Prepare Nodes\n  hosts: all\n  tasks: []" },
      ];
      setPlaybooks(mockPlaybooks);
    } catch (error: any) {
      toast.error("Không thể tải danh sách playbook");
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
    if (!playbookFilename.trim()) {
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

    try {
      setIsSavingPlaybook(true);
      
      // TODO: Call actual API endpoint to save playbook
      // await adminAPI.savePlaybook({
      //   filename: `${playbookFilename}.yml`,
      //   content: playbookContent,
      //   controllerHost: ansibleStatus.controllerHost,
      // });

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success(`Đã lưu playbook ${playbookFilename}.yml`);
      await loadPlaybooks();
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
      
      // TODO: Call actual API endpoint to delete playbook
      // await adminAPI.deletePlaybook({
      //   filename: selectedPlaybook,
      //   controllerHost: ansibleStatus.controllerHost,
      // });

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success(`Đã xóa playbook ${selectedPlaybook}`);
      setSelectedPlaybook(null);
      setPlaybookFilename("");
      setPlaybookContent("");
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
      
      // TODO: Call actual API endpoint to execute playbook
      // await adminAPI.executePlaybook({
      //   filename: selectedPlaybook,
      //   controllerHost: ansibleStatus.controllerHost,
      // });

      // Simulate execution process
      addPlaybookExecutionLog("Đang kết nối đến controller...", "info");
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      addPlaybookExecutionLog("Đang chạy ansible-playbook...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      addPlaybookExecutionLog("PLAY [all] ***********************************************************", "step");
      addPlaybookExecutionLog("TASK [Gathering Facts] *********************************************", "info");
      await new Promise((resolve) => setTimeout(resolve, 800));
      addPlaybookExecutionLog("ok: [node1]", "success");
      addPlaybookExecutionLog("ok: [node2]", "success");
      
      addPlaybookExecutionLog("TASK [Install packages] ********************************************", "info");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addPlaybookExecutionLog("changed: [node1]", "success");
      addPlaybookExecutionLog("changed: [node2]", "success");
      
      addPlaybookExecutionLog("", "info");
      addPlaybookExecutionLog("PLAY RECAP ***********************************************************", "step");
      addPlaybookExecutionLog("node1: ok=2    changed=1    unreachable=0    failed=0", "success");
      addPlaybookExecutionLog("node2: ok=2    changed=1    unreachable=0    failed=0", "success");
      addPlaybookExecutionLog("", "info");
      addPlaybookExecutionLog("🎉 Thực thi playbook thành công!", "success");
      
      toast.success(`Đã thực thi playbook ${selectedPlaybook} thành công!`);
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
  const executeStep1 = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    setRunningStep(1);
    addInitLog("Bước 1/4: Tạo cấu trúc thư mục Ansible trên controller...", "step");

    try {
      // TODO: Call actual API endpoint
      // await adminAPI.initAnsibleStep1(ansibleStatus.controllerHost);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addInitLog("✓ Đã tạo thư mục /opt/ansible", "success");
      addInitLog("✓ Đã tạo thư mục /opt/ansible/inventory", "success");
      addInitLog("✓ Đã tạo thư mục /opt/ansible/group_vars", "success");
      addInitLog("✓ Bước 1 hoàn tất", "success");
      
      toast.success("Bước 1 hoàn tất!");
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi không xác định";
      addInitLog(`Lỗi: ${errorMessage}`, "error");
      toast.error(`Lỗi ở bước 1: ${errorMessage}`);
    } finally {
      setRunningStep(null);
    }
  };

  // Bước 2: Ghi cấu hình mặc định
  const executeStep2 = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    setRunningStep(2);
    addInitLog("Bước 2/4: Ghi cấu hình mặc định (ansible.cfg, inventory)...", "step");

    try {
      // TODO: Call actual API endpoint
      // await adminAPI.initAnsibleStep2(ansibleStatus.controllerHost, ansibleCfg, ansibleInventory, ansibleVars);
      
      await new Promise((resolve) => setTimeout(resolve, 800));
      addInitLog("✓ Đã tạo file ansible.cfg", "success");
      addInitLog("✓ Đã tạo file inventory/hosts", "success");
      addInitLog("✓ Đã tạo file group_vars/all.yml", "success");
      addInitLog("✓ Bước 2 hoàn tất", "success");
      
      toast.success("Bước 2 hoàn tất!");
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi không xác định";
      addInitLog(`Lỗi: ${errorMessage}`, "error");
      toast.error(`Lỗi ở bước 2: ${errorMessage}`);
    } finally {
      setRunningStep(null);
    }
  };

  // Bước 3: Phân phối SSH key
  const executeStep3 = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    setRunningStep(3);
    addInitLog("Bước 3/4: Phân phối SSH key từ controller đến các nodes...", "step");

    try {
      const clusterServersForInit = servers.filter(
        (s) => s.clusterStatus === "AVAILABLE" && (s.role === "MASTER" || s.role === "WORKER")
      );

      if (clusterServersForInit.length === 0) {
        addInitLog("⚠️ Không có nodes nào trong cluster để phân phối key", "error");
        toast.warning("Không có nodes nào trong cluster");
        return;
      }

      // TODO: Call actual API endpoint
      // await adminAPI.initAnsibleStep3(ansibleStatus.controllerHost, clusterServersForInit.map(s => s.id));
      
      for (const server of clusterServersForInit) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        addInitLog(`  → Đang phân phối key đến ${server.name} (${server.ipAddress})...`, "info");
        await new Promise((resolve) => setTimeout(resolve, 500));
        addInitLog(`  ✓ Đã phân phối key đến ${server.name}`, "success");
      }

      addInitLog("✓ Bước 3 hoàn tất", "success");
      toast.success("Bước 3 hoàn tất!");
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi không xác định";
      addInitLog(`Lỗi: ${errorMessage}`, "error");
      toast.error(`Lỗi ở bước 3: ${errorMessage}`);
    } finally {
      setRunningStep(null);
    }
  };

  // Bước 4: Ping nodes
  const executeStep4 = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host.");
      return;
    }

    setRunningStep(4);
    addInitLog("Bước 4/4: Ping và kiểm tra kết nối đến các nodes...", "step");

    try {
      const clusterServersForInit = servers.filter(
        (s) => s.clusterStatus === "AVAILABLE" && (s.role === "MASTER" || s.role === "WORKER")
      );

      if (clusterServersForInit.length === 0) {
        addInitLog("⚠️ Không có nodes nào trong cluster để ping", "error");
        toast.warning("Không có nodes nào trong cluster");
        return;
      }

      // TODO: Call actual API endpoint
      // await adminAPI.initAnsibleStep4(ansibleStatus.controllerHost, clusterServersForInit.map(s => s.id));
      
      for (const server of clusterServersForInit) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        addInitLog(`  → Đang ping ${server.name} (${server.ipAddress})...`, "info");
        await new Promise((resolve) => setTimeout(resolve, 400));
        addInitLog(`  ✓ ${server.name} - Kết nối thành công`, "success");
      }

      addInitLog("✓ Bước 4 hoàn tất", "success");
      toast.success("Bước 4 hoàn tất!");
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi không xác định";
      addInitLog(`Lỗi: ${errorMessage}`, "error");
      toast.error(`Lỗi ở bước 4: ${errorMessage}`);
    } finally {
      setRunningStep(null);
    }
  };

  // Khởi tạo tuần tự cả 4 bước
  const handleStartInit = async () => {
    if (!ansibleStatus?.controllerHost) {
      toast.error("Không tìm thấy controller host. Vui lòng kiểm tra trạng thái Ansible trước.");
      return;
    }

    setIsInitializing(true);
    clearInitLogs();
    addInitLog("Bắt đầu quá trình khởi tạo Ansible...", "step");

    try {
      // Chạy tuần tự 4 bước
      await executeStep1();
      await executeStep2();
      await executeStep3();
      await executeStep4();

      addInitLog("", "info");
      addInitLog("🎉 Khởi tạo Ansible hoàn tất thành công!", "success");
      const clusterServersForInit = servers.filter(
        (s) => s.clusterStatus === "AVAILABLE" && (s.role === "MASTER" || s.role === "WORKER")
      );
      addInitLog(`Đã khởi tạo cho ${clusterServersForInit.length} nodes trong cluster.`, "info");
      
      // Đánh dấu phần 1 hoàn thành
      setPart1Completed(true);
      
      toast.success("Khởi tạo Ansible thành công! Phần 1 đã hoàn thành.");
      
      // Tự động chuyển sang phần 2 sau 1 giây
      setTimeout(() => {
        setExpandedSection("kubernetes");
        setK8sActiveTab("tab1");
        toast.info("Đã chuyển sang Phần 2: Cài đặt Kubernetes");
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi không xác định";
      addInitLog(`Lỗi: ${errorMessage}`, "error");
      toast.error(`Lỗi khi khởi tạo: ${errorMessage}`);
    } finally {
      setIsInitializing(false);
    }
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
      {cluster && (
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tên Cluster</p>
                <p className="text-lg font-semibold">{cluster.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="text-lg font-semibold">{cluster.version}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số Nodes</p>
                <p className="text-lg font-semibold">{cluster.nodeCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <Badge variant={cluster.status === "healthy" ? "default" : "secondary"}>
                  {cluster.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            {/* Kiểm tra trạng thái và hiển thị status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleCheckAnsibleStatus}
                  disabled={isCheckingAnsibleStatus || ansibleServers.length === 0}
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
                {ansibleStatus && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {ansibleStatus.installed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {ansibleStatus.installed ? "Đã cài đặt" : "Chưa cài đặt"}
                      </span>
                    </div>
                    {ansibleStatus.version && (
                      <Badge variant="outline">Version: {ansibleStatus.version}</Badge>
                    )}
                    {ansibleStatus.controllerHost && (
                      <Badge variant="secondary">
                        Controller: {ansibleStatus.controllerHost}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {ansibleStatus?.installed && (
                <div className="flex items-center gap-2">
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
                </div>
              )}
            </div>

            {/* Danh sách Ansible Servers */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Servers có role ANSIBLE ({ansibleServers.length})
              </Label>
              {ansibleServers.length === 0 ? (
                <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Chưa có server nào với role ANSIBLE</p>
                  <p className="text-sm mt-1">Vui lòng thêm server với role ANSIBLE trong trang Servers</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left">Tên</th>
                        <th className="p-3 text-left">IP Address</th>
                        <th className="p-3 text-left">Port</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ansibleServers.map((server) => (
                        <tr key={server.id} className="border-t hover:bg-muted/50">
                          <td className="p-3 font-medium">{server.name}</td>
                          <td className="p-3">{server.ipAddress}</td>
                          <td className="p-3">{server.port || 22}</td>
                          <td className="p-3">
                            <Badge variant={server.status === "online" ? "default" : "secondary"}>
                              {server.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{server.role}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Thông tin cài đặt */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Thông tin cài đặt Ansible:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Ansible sẽ được cài đặt trên các server có role=ANSIBLE</li>
                    <li>Quá trình cài đặt sẽ tự động cấu hình Python, pip và các dependencies cần thiết</li>
                    <li>Sau khi cài đặt xong, Ansible có thể được sử dụng để quản lý các server khác</li>
                    <li>Controller node sẽ được tự động chọn (ưu tiên role=ANSIBLE, sau đó role=MASTER)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="flex flex-wrap gap-3">
              {!ansibleStatus?.installed ? (
                <Button
                  onClick={handleInstallAnsible}
                  disabled={isInstallingAnsible || ansibleServers.length === 0}
                  size="lg"
                  className="min-w-[200px]"
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
                </>
              )}
            </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
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
                  <span className="text-xs text-gray-300 font-mono">Console Output</span>
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

            {/* Step Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t">
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
            <div className="flex justify-end gap-2 pt-2 border-t">
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
        </DialogContent>
      </Dialog>

      {/* Config Ansible Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <p className="text-xs text-muted-foreground">
                    Chỉ chứa MASTER và WORKER, không có ANSIBLE
                  </p>
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
                  disabled={!ansibleStatus?.installed}
                >
                  Lưu cấu hình
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Playbook & K8s Modal */}
      <Dialog open={showPlaybookModal} onOpenChange={setShowPlaybookModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
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
                  onClick={loadPlaybooks}
                  disabled={!ansibleStatus?.installed}
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
                  {filteredPlaybooks.length === 0 ? (
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
    </div>
  );
}

