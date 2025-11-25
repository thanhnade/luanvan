package my_spring_app.my_spring_app.controller;

import my_spring_app.my_spring_app.dto.reponse.AdminOverviewResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminProjectResourceDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectListResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectSummaryResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserUsageResponse;
import my_spring_app.my_spring_app.dto.reponse.ClusterCapacityResponse;
import my_spring_app.my_spring_app.dto.reponse.ClusterAllocatableResponse;
import my_spring_app.my_spring_app.dto.reponse.ClusterInfoResponse;
import my_spring_app.my_spring_app.dto.reponse.AnsibleStatusResponse;
import my_spring_app.my_spring_app.dto.reponse.AnsibleConfigResponse;
import my_spring_app.my_spring_app.dto.reponse.ServerAuthStatusResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminDatabaseDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminBackendDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminFrontendDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.DashboardMetricsResponse;
import my_spring_app.my_spring_app.dto.reponse.NodeListResponse;
import my_spring_app.my_spring_app.dto.reponse.NamespaceListResponse;
import my_spring_app.my_spring_app.dto.reponse.DeploymentListResponse;
import my_spring_app.my_spring_app.dto.reponse.PodListResponse;
import my_spring_app.my_spring_app.dto.reponse.StatefulsetListResponse;
import my_spring_app.my_spring_app.dto.reponse.ServiceListResponse;
import my_spring_app.my_spring_app.dto.reponse.IngressListResponse;
import my_spring_app.my_spring_app.dto.reponse.PVCListResponse;
import my_spring_app.my_spring_app.dto.reponse.PVListResponse;
import my_spring_app.my_spring_app.service.AdminService;
import my_spring_app.my_spring_app.service.AnsibleService;
import my_spring_app.my_spring_app.service.ServerService;
import my_spring_app.my_spring_app.dto.reponse.AnsibleOperationResponse;
import my_spring_app.my_spring_app.dto.reponse.PlaybookListResponse;
import my_spring_app.my_spring_app.dto.request.InstallAnsibleRequest;
import my_spring_app.my_spring_app.dto.request.InitAnsibleRequest;
import my_spring_app.my_spring_app.dto.request.SaveAnsibleConfigRequest;
import my_spring_app.my_spring_app.dto.request.VerifyAnsibleConfigRequest;
import my_spring_app.my_spring_app.dto.request.SavePlaybookRequest;
import my_spring_app.my_spring_app.dto.request.DeletePlaybookRequest;
import my_spring_app.my_spring_app.dto.request.ExecutePlaybookRequest;
import my_spring_app.my_spring_app.dto.request.InstallK8sRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private AnsibleService ansibleService;
    
    @Autowired
    private ServerService serverService;

    // User Services - Services
    // Cluster & Overview - Overview
    @GetMapping("/user-services/overview")
    public ResponseEntity<AdminOverviewResponse> getOverview() {
        AdminOverviewResponse response = adminService.getOverview();
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/user-services/users")
    public ResponseEntity<AdminUserUsageResponse> getUserUsage() {
        AdminUserUsageResponse response = adminService.getUserResourceOverview();
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/user-services/user-summary")
    public ResponseEntity<AdminUserProjectSummaryResponse> getUserSummary(@RequestParam Long userId) {
        AdminUserProjectSummaryResponse response = adminService.getUserProjectSummary(userId);
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/user-services/user-projects")
    public ResponseEntity<AdminUserProjectListResponse> getUserProjects(@RequestParam Long userId) {
        AdminUserProjectListResponse response = adminService.getUserProjectsDetail(userId);
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/user-services/project-resources")
    public ResponseEntity<AdminProjectResourceDetailResponse> getProjectResources(@RequestParam Long projectId) {
        AdminProjectResourceDetailResponse response = adminService.getProjectResourceDetail(projectId);
        return ResponseEntity.ok(response);
    }

    // Cluster Services - Services
    // Cluster & Overview - Overview
    @GetMapping("/cluster/capacity")
    public ResponseEntity<ClusterCapacityResponse> getClusterCapacity() {
        ClusterCapacityResponse response = adminService.getClusterCapacity();
        return ResponseEntity.ok(response);
    }

    // Cluster Services - Services
    // Cluster & Overview - Overview
    @GetMapping("/cluster/allocatable")
    public ResponseEntity<ClusterAllocatableResponse> getClusterAllocatable() {
        ClusterAllocatableResponse response = adminService.getClusterAllocatable();
        return ResponseEntity.ok(response);
    }

    // Infrastructure - Cluster Info
    @GetMapping("/cluster/info")
    public ResponseEntity<ClusterInfoResponse> getClusterInfo() {
        ClusterInfoResponse response = adminService.getClusterInfo();
        return ResponseEntity.ok(response);
    }

    // Infrastructure - Ansible Status
    @GetMapping("/ansible/status")
    public ResponseEntity<AnsibleStatusResponse> getAnsibleStatus() {
        AnsibleStatusResponse response = ansibleService.getAnsibleStatus();
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Server Auth Status
    @GetMapping("/server/auth-status")
    public ResponseEntity<ServerAuthStatusResponse> getServerAuthStatus(@RequestParam Long serverId) {
        ServerAuthStatusResponse response = serverService.checkServerAuthStatus(serverId);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Install Ansible
    @PostMapping("/ansible/install")
    public ResponseEntity<AnsibleOperationResponse> installAnsible(@Valid @RequestBody InstallAnsibleRequest request) {
        AnsibleOperationResponse response = ansibleService.installAnsible(request);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Reinstall Ansible
    @PostMapping("/ansible/reinstall")
    public ResponseEntity<AnsibleOperationResponse> reinstallAnsible(@Valid @RequestBody InstallAnsibleRequest request) {
        AnsibleOperationResponse response = ansibleService.reinstallAnsible(request);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Uninstall Ansible
    @PostMapping("/ansible/uninstall")
    public ResponseEntity<AnsibleOperationResponse> uninstallAnsible(@Valid @RequestBody InstallAnsibleRequest request) {
        AnsibleOperationResponse response = ansibleService.uninstallAnsible(request);
        return ResponseEntity.ok(response);
    }
    
    // ==================== Init Ansible (4 steps) ====================
    
    // Infrastructure - Init Ansible Step 1
    @PostMapping("/ansible/init/step1")
    public ResponseEntity<AnsibleOperationResponse> initAnsibleStep1(@Valid @RequestBody InitAnsibleRequest request) {
        AnsibleOperationResponse response = ansibleService.initAnsibleStep1(request);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Init Ansible Step 2
    @PostMapping("/ansible/init/step2")
    public ResponseEntity<AnsibleOperationResponse> initAnsibleStep2(@Valid @RequestBody InitAnsibleRequest request) {
        AnsibleOperationResponse response = ansibleService.initAnsibleStep2(request);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Init Ansible Step 3
    @PostMapping("/ansible/init/step3")
    public ResponseEntity<AnsibleOperationResponse> initAnsibleStep3(@Valid @RequestBody InitAnsibleRequest request) {
        AnsibleOperationResponse response = ansibleService.initAnsibleStep3(request);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Init Ansible Step 4
    @PostMapping("/ansible/init/step4")
    public ResponseEntity<AnsibleOperationResponse> initAnsibleStep4(@Valid @RequestBody InitAnsibleRequest request) {
        AnsibleOperationResponse response = ansibleService.initAnsibleStep4(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/ansible/init/status")
    public ResponseEntity<my_spring_app.my_spring_app.dto.reponse.AnsibleTaskStatusResponse> getAnsibleInitStatus(
            @RequestParam String taskId) {
        my_spring_app.my_spring_app.dto.reponse.AnsibleTaskStatusResponse response = ansibleService.getInitTaskStatus(taskId);
        return ResponseEntity.ok(response);
    }
    
    // ==================== Config Ansible ====================
    
    // Infrastructure - Save Ansible Config
    @PostMapping("/ansible/config/save")
    public ResponseEntity<AnsibleOperationResponse> saveAnsibleConfig(@Valid @RequestBody SaveAnsibleConfigRequest request) {
        AnsibleOperationResponse response = ansibleService.saveAnsibleConfig(request);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Verify Ansible Config
    @PostMapping("/ansible/config/verify")
    public ResponseEntity<AnsibleOperationResponse> verifyAnsibleConfig(@Valid @RequestBody VerifyAnsibleConfigRequest request) {
        AnsibleOperationResponse response = ansibleService.verifyAnsibleConfig(request);
        return ResponseEntity.ok(response);
    }
    
    // ==================== Playbook ====================
    
    // Infrastructure - Get Playbooks
    @GetMapping("/ansible/playbooks")
    public ResponseEntity<PlaybookListResponse> getPlaybooks(@RequestParam(required = false) String controllerHost) {
        PlaybookListResponse response = ansibleService.getPlaybooks(controllerHost);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Save Playbook
    @PostMapping("/ansible/playbooks/save")
    public ResponseEntity<AnsibleOperationResponse> savePlaybook(@Valid @RequestBody SavePlaybookRequest request) {
        AnsibleOperationResponse response = ansibleService.savePlaybook(request);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Delete Playbook
    @PostMapping("/ansible/playbooks/delete")
    public ResponseEntity<AnsibleOperationResponse> deletePlaybook(@Valid @RequestBody DeletePlaybookRequest request) {
        AnsibleOperationResponse response = ansibleService.deletePlaybook(request);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Execute Playbook
    @PostMapping("/ansible/playbooks/execute")
    public ResponseEntity<AnsibleOperationResponse> executePlaybook(@Valid @RequestBody ExecutePlaybookRequest request) {
        AnsibleOperationResponse response = ansibleService.executePlaybook(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/ansible/playbooks/status")
    public ResponseEntity<my_spring_app.my_spring_app.dto.reponse.AnsibleTaskStatusResponse> getPlaybookExecutionStatus(
            @RequestParam String taskId) {
        my_spring_app.my_spring_app.dto.reponse.AnsibleTaskStatusResponse response =
                ansibleService.getPlaybookTaskStatus(taskId);
        return ResponseEntity.ok(response);
    }

    // Infrastructure - Upload Playbook
    @PostMapping("/ansible/playbooks/upload")
    public ResponseEntity<AnsibleOperationResponse> uploadPlaybook(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String controllerHost,
            @RequestParam(required = false) String sudoPassword) {
        AnsibleOperationResponse response = ansibleService.uploadPlaybook(file, controllerHost, sudoPassword);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Get Ansible Config
    @GetMapping("/ansible/config")
    public ResponseEntity<AnsibleConfigResponse> getAnsibleConfig(
            @RequestParam(required = false) String controllerHost) {
        AnsibleConfigResponse response = ansibleService.getAnsibleConfig(controllerHost);
        return ResponseEntity.ok(response);
    }
    
    // ==================== Install K8s ====================
    
    // Infrastructure - Install K8s Tab 1
    @PostMapping("/k8s/install/tab1")
    public ResponseEntity<AnsibleOperationResponse> installK8sTab1(@Valid @RequestBody InstallK8sRequest request) {
        AnsibleOperationResponse response = ansibleService.installK8sTab1(request);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Install K8s Tab 2
    @PostMapping("/k8s/install/tab2")
    public ResponseEntity<AnsibleOperationResponse> installK8sTab2(@Valid @RequestBody InstallK8sRequest request) {
        AnsibleOperationResponse response = ansibleService.installK8sTab2(request);
        return ResponseEntity.ok(response);
    }
    
    // Infrastructure - Install K8s Tab 3
    @PostMapping("/k8s/install/tab3")
    public ResponseEntity<AnsibleOperationResponse> installK8sTab3(@Valid @RequestBody InstallK8sRequest request) {
        AnsibleOperationResponse response = ansibleService.installK8sTab3(request);
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/database/detail")
    public ResponseEntity<AdminDatabaseDetailResponse> getDatabaseDetail(@RequestParam Long databaseId) {
        AdminDatabaseDetailResponse response = adminService.getDatabaseDetail(databaseId);
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/backend/detail")
    public ResponseEntity<AdminBackendDetailResponse> getBackendDetail(@RequestParam Long backendId) {
        AdminBackendDetailResponse response = adminService.getBackendDetail(backendId);
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/frontend/detail")
    public ResponseEntity<AdminFrontendDetailResponse> getFrontendDetail(@RequestParam Long frontendId) {
        AdminFrontendDetailResponse response = adminService.getFrontendDetail(frontendId);
        return ResponseEntity.ok(response);
    }

    // Cluster & Overview - Overview
    @GetMapping("/dashboard/metrics")
    public ResponseEntity<DashboardMetricsResponse> getDashboardMetrics() {
        DashboardMetricsResponse response = adminService.getDashboardMetrics();
        return ResponseEntity.ok(response);
    }

    // Cluster & Overview  - Nodes
    @GetMapping("/cluster/nodes")
    public ResponseEntity<NodeListResponse> getNodes() {
        NodeListResponse response = adminService.getNodes();
        return ResponseEntity.ok(response);
    }

    // Cluster & Overview  - Namespaces
    @GetMapping("/cluster/namespaces")
    public ResponseEntity<NamespaceListResponse> getNamespaces() {
        NamespaceListResponse response = adminService.getNamespaces();
        return ResponseEntity.ok(response);
    }

    // Workloads - Deployments
    @GetMapping("/workloads/deployments")
    public ResponseEntity<DeploymentListResponse> getDeployments() {
        DeploymentListResponse response = adminService.getDeployments();
        return ResponseEntity.ok(response);
    }

    // Workloads - Pods
    @GetMapping("/workloads/pods")
    public ResponseEntity<PodListResponse> getPods() {
        PodListResponse response = adminService.getPods();
        return ResponseEntity.ok(response);
    }

    // Workloads - Statefulsets
    @GetMapping("/workloads/statefulsets")
    public ResponseEntity<StatefulsetListResponse> getStatefulsets() {
        StatefulsetListResponse response = adminService.getStatefulsets();
        return ResponseEntity.ok(response);
    }

    // Service Discovery - Services
    @GetMapping("/services")
    public ResponseEntity<ServiceListResponse> getServices() {
        ServiceListResponse response = adminService.getServices();
        return ResponseEntity.ok(response);
    }

    // Service Discovery - Ingress
    @GetMapping("/ingress")
    public ResponseEntity<IngressListResponse> getIngress() {
        IngressListResponse response = adminService.getIngress();
        return ResponseEntity.ok(response);
    }

    // Storage - PVCs
    @GetMapping("/storage/pvcs")
    public ResponseEntity<PVCListResponse> getPVCs() {
        PVCListResponse response = adminService.getPVCs();
        return ResponseEntity.ok(response);
    }

    // Storage - PVs
    @GetMapping("/storage/pvs")
    public ResponseEntity<PVListResponse> getPVs() {
        PVListResponse response = adminService.getPVs();
        return ResponseEntity.ok(response);
    }
}