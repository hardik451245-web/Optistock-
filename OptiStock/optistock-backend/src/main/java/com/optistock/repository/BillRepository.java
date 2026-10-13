package com.optistock.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.optistock.entity.Bill;
import com.optistock.entity.BillStatus;

public interface BillRepository extends JpaRepository<Bill, Long> {

	@Query("SELECT b FROM Bill b WHERE b.createdAt >= :from AND b.createdAt < :to ORDER BY b.createdAt DESC")
	List<Bill> findByCreatedAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Query("SELECT b FROM Bill b WHERE b.createdAt >= :from AND b.createdAt < :to AND b.cashierId = :cashierId ORDER BY b.createdAt DESC")
	List<Bill> findByCreatedAtBetweenAndCashierId(@Param("from") LocalDateTime from,
			@Param("to") LocalDateTime to, @Param("cashierId") Long cashierId);

	@Query("SELECT COUNT(b) FROM Bill b WHERE b.createdAt >= :from AND b.createdAt < :to AND b.status = :status")
	long countByDateRangeAndStatus(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
			@Param("status") BillStatus status);

	@Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.createdAt >= :from AND b.createdAt < :to AND b.status = :status")
	java.math.BigDecimal sumTotalAmountByDateRangeAndStatus(@Param("from") LocalDateTime from,
			@Param("to") LocalDateTime to, @Param("status") BillStatus status);

	@Query(value = "SELECT DATE(b.created_at) AS bill_date, COUNT(DISTINCT b.id) AS bill_count, " +
			"COALESCE(SUM(b.total_amount), 0) AS net_sales " +
			"FROM bills b WHERE b.created_at >= :from AND b.created_at < :to AND b.status = 'COMPLETED' " +
			"GROUP BY DATE(b.created_at) ORDER BY bill_date", nativeQuery = true)
	List<Object[]> dailyTotals(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
