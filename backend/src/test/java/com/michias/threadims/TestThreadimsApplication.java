package com.michias.threadims;

import org.springframework.boot.SpringApplication;

public class TestThreadimsApplication {

	public static void main(String[] args) {
		SpringApplication.from(ThreadimsApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
