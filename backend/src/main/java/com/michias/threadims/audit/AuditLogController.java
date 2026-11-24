package com.michias.threadims.audit;

import com.michias.threadims.audit.dto.AuditLogResponse;
import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.report.ExportWriter;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/activity-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ApiResponse<Page<AuditLogResponse>> search(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ApiResponse.ok(auditLogService.search(
                userId, username, module, actionType, success, from, to, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ApiResponse<AuditLogResponse> get(@PathVariable UUID id) {
        return ApiResponse.ok(auditLogService.getById(id));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "csv") String format) {
        List<AuditLogResponse> rows = auditLogService
                .search(userId, username, module, actionType, success, from, to, PageRequest.of(0, 5000))
                .getContent();

        List<String> headers =
                List.of("Timestamp", "Username", "Role", "Module", "Action", "Description", "Entity", "Success");
        List<List<String>> body = rows.stream()
                .map(r -> List.of(
                        String.valueOf(r.createdAt()),
                        r.username() == null ? "" : r.username(),
                        r.userRole() == null ? "" : r.userRole(),
                        r.module(),
                        r.actionType(),
                        r.description() == null ? "" : r.description(),
                        (r.entityType() == null ? "" : r.entityType())
                                + (r.entityId() == null ? "" : (" " + r.entityId())),
                        String.valueOf(r.success())))
                .toList();

        byte[] content;
        MediaType mediaType;
        String filename;
        if ("xlsx".equalsIgnoreCase(format)) {
            content = ExportWriter.toXlsx("Activity Log", headers, body);
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            filename = "activity-log.xlsx";
        } else if ("csv".equalsIgnoreCase(format)) {
            content = ExportWriter.toCsv(headers, body);
            mediaType = MediaType.parseMediaType("text/csv");
            filename = "activity-log.csv";
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported export format: " + format);
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(content);
    }
}
