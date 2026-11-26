package com.michias.threadims.report;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

/**
 * Minimal, dependency-light CSV/Excel generation shared by every report
 * export — no templating, just headers + rows.
 */
public final class ExportWriter {

    private ExportWriter() {}

    public static byte[] toCsv(List<String> headers, List<List<String>> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append(headers.stream().map(ExportWriter::escapeCsv).reduce((a, b) -> a + "," + b).orElse(""));
        sb.append("\r\n");
        for (List<String> row : rows) {
            sb.append(row.stream().map(ExportWriter::escapeCsv).reduce((a, b) -> a + "," + b).orElse(""));
            sb.append("\r\n");
        }
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    public static byte[] toXlsx(String sheetName, List<String> headers, List<List<String>> rows) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet(sheetName);
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < headers.size(); col++) {
                headerRow.createCell(col).setCellValue(headers.get(col));
            }
            for (int rowIdx = 0; rowIdx < rows.size(); rowIdx++) {
                Row row = sheet.createRow(rowIdx + 1);
                List<String> values = rows.get(rowIdx);
                for (int col = 0; col < values.size(); col++) {
                    Cell cell = row.createCell(col);
                    cell.setCellValue(values.get(col));
                }
            }
            for (int col = 0; col < headers.size(); col++) {
                sheet.autoSizeColumn(col);
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        value = neutralizeFormula(value);
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    /**
     * Spreadsheet apps (Excel, LibreOffice, Google Sheets) evaluate a CSV
     * cell as a formula when it starts with {@code =}, {@code +}, {@code -},
     * or {@code @}. Report data (e.g. audit log descriptions) can contain
     * attacker-controlled text — e.g. a login username, which is never
     * validated since login is unauthenticated — so prefix such values with
     * a single quote to force spreadsheet apps to treat them as plain text
     * and prevent CSV/formula injection (CWE-1236).
     */
    private static String neutralizeFormula(String value) {
        if (!value.isEmpty()) {
            char first = value.charAt(0);
            if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
                return "'" + value;
            }
        }
        return value;
    }
}
