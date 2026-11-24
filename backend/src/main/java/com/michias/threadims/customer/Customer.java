package com.michias.threadims.customer;

import com.michias.threadims.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "customers")
public class Customer extends BaseEntity {

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 30)
    private String phone;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
