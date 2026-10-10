package com.optistock.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.optistock.entity.Bill;

public interface BillRepository extends JpaRepository<Bill, Long> {
}
