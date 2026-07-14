-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 14, 2026 at 10:58 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.4.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cinemates`
--

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE `chats` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `sender` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chats`
--

INSERT INTO `chats` (`id`, `room_id`, `sender`, `message`, `created_at`) VALUES
(7, 5, 'blububfish', 'tes', '2026-07-14 07:23:16'),
(8, 5, 'blububfish', 'yes', '2026-07-14 07:23:24'),
(9, 5, 'blububfish', 'tes', '2026-07-14 07:23:25'),
(10, 5, 'blububfish', 'helo', '2026-07-14 07:23:30'),
(11, 5, 'blububfish', 'tes', '2026-07-14 08:06:24'),
(12, 5, 'blububfish', '1', '2026-07-14 08:06:31'),
(13, 5, 'blububfish', '2', '2026-07-14 08:06:31'),
(14, 5, 'blububfish', '3', '2026-07-14 08:06:31'),
(15, 5, 'blububfish', '4', '2026-07-14 08:06:32'),
(16, 5, 'blububfish', '5', '2026-07-14 08:06:32'),
(17, 5, 'blububfish', '56', '2026-07-14 08:06:34'),
(18, 5, 'blububfish', 'tes', '2026-07-14 08:12:09'),
(19, 5, 'blububfish', 'tes', '2026-07-14 08:12:11'),
(20, 5, 'blububfish', 'tes', '2026-07-14 08:12:13'),
(21, 5, 'blububfish', 'tes', '2026-07-14 08:12:14'),
(22, 5, 'blububfish', 'tes', '2026-07-14 08:12:17'),
(23, 5, 'blububfish', 'tes', '2026-07-14 08:12:19'),
(24, 5, 'blububfish', '1', '2026-07-14 08:12:45'),
(25, 5, 'blububfish', '2', '2026-07-14 08:12:46'),
(26, 5, 'blububfish', '3', '2026-07-14 08:12:47'),
(27, 5, 'blububfish', '4', '2026-07-14 08:12:49'),
(28, 5, 'blububfish', '5', '2026-07-14 08:12:50'),
(29, 5, 'blububfish', '1', '2026-07-14 08:13:28'),
(30, 5, 'blububfish', '2', '2026-07-14 08:13:29'),
(31, 5, 'blububfish', '3', '2026-07-14 08:13:31'),
(32, 5, 'blububfish', '4', '2026-07-14 08:13:32'),
(33, 5, 'blububfish', '5', '2026-07-14 08:13:34'),
(34, 5, 'blububfish', 'tes', '2026-07-14 08:25:42'),
(35, 5, 'blububfish', 'TES', '2026-07-14 08:29:18'),
(36, 5, 'blububfish', '1', '2026-07-14 08:29:21'),
(37, 5, 'blububfish', '2', '2026-07-14 08:29:23'),
(38, 5, 'blububfish', '3', '2026-07-14 08:29:26'),
(39, 5, 'blububfish', '4', '2026-07-14 08:29:27'),
(40, 5, 'blububfish', '5', '2026-07-14 08:29:29'),
(41, 5, 'blububfish', '6', '2026-07-14 08:29:30'),
(42, 5, 'blububfish', 'A', '2026-07-14 08:29:39'),
(43, 5, 'blububfish', 'A', '2026-07-14 08:29:40'),
(44, 5, 'blububfish', 'A', '2026-07-14 08:29:40'),
(45, 5, 'blububfish', 'A', '2026-07-14 08:29:41'),
(46, 5, 'blububfish', 'A', '2026-07-14 08:29:42'),
(47, 5, 'blububfish', 'A', '2026-07-14 08:29:43'),
(48, 5, 'blububfish', '2', '2026-07-14 08:29:59'),
(49, 5, 'blububfish', '1', '2026-07-14 08:36:03'),
(50, 5, 'blububfish', '2', '2026-07-14 08:36:04'),
(51, 5, 'blububfish', '3', '2026-07-14 08:36:05'),
(52, 5, 'blububfish', '4', '2026-07-14 08:36:06'),
(53, 5, 'blububfish', '5', '2026-07-14 08:36:07'),
(54, 5, 'blububfish', '6', '2026-07-14 08:36:08'),
(55, 5, 'blububfish', '7', '2026-07-14 08:36:10'),
(56, 5, 'blububfish', '1', '2026-07-14 08:36:54'),
(57, 5, 'blububfish', '2', '2026-07-14 08:36:55'),
(58, 5, 'blububfish', '3', '2026-07-14 08:36:56'),
(59, 5, 'blububfish', '4', '2026-07-14 08:36:58'),
(60, 5, 'blububfish', '5', '2026-07-14 08:37:01'),
(61, 5, 'blububfish', '6', '2026-07-14 08:37:02'),
(62, 5, 'blububfish', '7', '2026-07-14 08:37:25');

-- --------------------------------------------------------

--
-- Table structure for table `files`
--

CREATE TABLE `files` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_size` int(11) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `files`
--

INSERT INTO `files` (`id`, `room_id`, `file_name`, `file_size`, `file_url`, `created_at`) VALUES
(1, 2, 'betafish.jpg', 62211, '/uploads/betafish.jpg', '2026-07-12 08:24:28'),
(2, 2, 'e86cde2b8c4f33daf53c39910c38c024.mp4', 4367413, '/uploads/e86cde2b8c4f33daf53c39910c38c024.mp4', '2026-07-12 08:25:32'),
(3, 5, 'betafish.jpg', 62211, '/uploads/betafish.jpg', '2026-07-14 07:22:42'),
(4, 5, 'e86cde2b8c4f33daf53c39910c38c024.mp4', 4367413, '/uploads/e86cde2b8c4f33daf53c39910c38c024.mp4', '2026-07-14 07:23:07');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `room_name` varchar(100) NOT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `max_participants` int(11) DEFAULT 8,
  `genre` varchar(50) NOT NULL,
  `privacy` varchar(20) NOT NULL DEFAULT 'public',
  `room_code` varchar(10) DEFAULT NULL,
  `host_name` varchar(50) NOT NULL,
  `current_participants` int(11) DEFAULT 1,
  `status` varchar(20) DEFAULT 'live',
  `video_action` varchar(20) DEFAULT NULL,
  `video_time` float DEFAULT 0,
  `video_state` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `room_name`, `video_url`, `max_participants`, `genre`, `privacy`, `room_code`, `host_name`, `current_participants`, `status`, `created_at`) VALUES
(5, 'Summer Study!', 'https://youtu.be/Kj0qen0hth8?si=fH5mb4Fc8HBOjwvt', 6, 'studi', 'public', NULL, 'blububfish', 1, 'live', '2026-07-14 07:07:59');

-- --------------------------------------------------------

--
-- Table structure for table `room_participants`
--

CREATE TABLE `room_participants` (
  `id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `is_host` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_participants`
--

INSERT INTO `room_participants` (`id`, `room_id`, `username`, `is_host`) VALUES
(97, 5, 'blububfish', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_verified` tinyint(4) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `is_verified`, `verification_token`) VALUES
(15, 'blububfish', 'sephiqput@gmail.com', '$2b$10$Cg2599iA6YJbOs0vdrShmOakOmh7u00uBK9imzy2.knlrfwWT/Z3i', 1, NULL),
(16, 'piastri', 'rahmasephiap@gmail.com', '$2b$10$60aIMGEEeLx6eNzsDnoj3eBAd65reIBgGmPolAnrgSgD/a6MNtRFu', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `watch_history`
--

CREATE TABLE `watch_history` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `room_id` int(11) NOT NULL,
  `video_title` varchar(255) NOT NULL,
  `room_name` varchar(150) NOT NULL,
  `genre` varchar(50) DEFAULT 'lainnya',
  `status` enum('done','partial') DEFAULT 'partial',
  `watched_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `watch_history`
--

INSERT INTO `watch_history` (`id`, `username`, `room_id`, `video_title`, `room_name`, `genre`, `status`, `watched_at`) VALUES
(6, 'piastri', 0, 'Nobar - Pidato Prabowo', 'Nobar - Pidato Prabowo', 'anime', 'partial', '2026-07-12 14:50:20'),
(18, 'sephiaase', 0, 'Lofi - Reading Room', 'Lofi - Reading Room', 'studi', 'partial', '2026-07-14 07:05:16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `room_participants`
--
ALTER TABLE `room_participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `watch_history`
--
ALTER TABLE `watch_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_room` (`username`,`room_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `files`
--
ALTER TABLE `files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `room_participants`
--
ALTER TABLE `room_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `watch_history`
--
ALTER TABLE `watch_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chats`
--
ALTER TABLE `chats`
  ADD CONSTRAINT `chats_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_participants`
--
ALTER TABLE `room_participants`
  ADD CONSTRAINT `room_participants_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
