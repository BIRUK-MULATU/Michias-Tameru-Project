package com.michias.threadims.product;

import com.michias.threadims.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "brands")
public class Brand extends BaseEntity {

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
