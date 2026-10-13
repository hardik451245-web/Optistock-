package com.optistock.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.optistock.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

	List<Product> findByActiveTrue();

	Optional<Product> findByIdAndActiveTrue(Long id);

	List<Product> findByCategoryAndIdNot(String category, Long id);

	List<Product> findByCategoryAndIdNotAndActiveTrue(String category, Long id);
}
