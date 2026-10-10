package com.optistock.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.optistock.entity.BillItem;

public interface BillItemRepository extends JpaRepository<BillItem, Long> {

	List<BillItem> findByBillId(Long billId);
}
