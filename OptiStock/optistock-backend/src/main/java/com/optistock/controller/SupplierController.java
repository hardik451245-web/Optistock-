package com.optistock.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.optistock.entity.Supplier;
import com.optistock.exception.ResourceNotFoundException;
import com.optistock.repository.SupplierRepository;

@RestController
@RequestMapping("/api/manager/suppliers")
public class SupplierController {

	private final SupplierRepository supplierRepository;

	public SupplierController(SupplierRepository supplierRepository) {
		this.supplierRepository = supplierRepository;
	}

	@GetMapping
	public ResponseEntity<List<Supplier>> listSuppliers() {
		return ResponseEntity.ok(supplierRepository.findAllByOrderByNameAsc());
	}

	@PostMapping
	public ResponseEntity<Supplier> createSupplier(@RequestBody Supplier supplier) {
		if (supplier.getName() == null || supplier.getName().trim().isEmpty()) {
			throw new IllegalArgumentException("Supplier name is required");
		}
		supplier.setId(null);
		return ResponseEntity.status(HttpStatus.CREATED).body(supplierRepository.save(supplier));
	}

	@PutMapping("/{id}")
	public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id, @RequestBody Supplier updated) {
		Supplier existing = supplierRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));

		if (updated.getName() != null && !updated.getName().trim().isEmpty()) {
			existing.setName(updated.getName().trim());
		}
		existing.setContactPerson(updated.getContactPerson());
		existing.setPhone(updated.getPhone());
		existing.setWhatsappNumber(updated.getWhatsappNumber());
		existing.setEmail(updated.getEmail());
		existing.setAddress(updated.getAddress());
		existing.setCategory(updated.getCategory());

		return ResponseEntity.ok(supplierRepository.save(existing));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
		if (supplierRepository.existsById(id)) {
			supplierRepository.deleteById(id);
		}
		return ResponseEntity.noContent().build();
	}
}
