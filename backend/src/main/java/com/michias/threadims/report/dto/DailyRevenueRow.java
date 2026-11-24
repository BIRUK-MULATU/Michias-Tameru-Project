package com.michias.threadims.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyRevenueRow(LocalDate date, BigDecimal revenue, long transactions) {
}
