package com.michias.threadims.security;

import com.michias.threadims.user.User;
import com.michias.threadims.user.UserLocationAssignmentRepository;
import com.michias.threadims.user.UserRepository;
import java.util.UUID;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserLocationAssignmentRepository assignmentRepository;

    public CustomUserDetailsService(
            UserRepository userRepository, UserLocationAssignmentRepository assignmentRepository) {
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("No user with username: " + username));
        UUID locationId = assignmentRepository
                .findByUserIdAndUnassignedAtIsNull(user.getId())
                .map(assignment -> assignment.getLocation().getId())
                .orElse(null);
        return UserPrincipal.from(user, locationId);
    }
}
