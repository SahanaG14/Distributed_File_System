-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: dfs_storage
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `file_name` varchar(100) DEFAULT NULL,
  `activity_type` varchar(100) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `result` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
INSERT INTO `activity_log` VALUES (1,10,'logo.png','UPLOAD','2026-05-21 17:26:30','SUCCESS'),(2,10,'photos','FOLDER_CREATE','2026-05-21 17:26:50','SUCCESS'),(3,10,'image2.png','UPLOAD','2026-05-21 17:28:05','SUCCESS'),(4,10,'Screenshot (9).png','UPLOAD','2026-05-22 21:57:51','SUCCESS'),(5,10,'Screenshot (2).png','UPLOAD','2026-05-22 22:29:14','SUCCESS'),(6,10,'tamil.jpeg','UPLOAD','2026-05-24 11:08:20','SUCCESS'),(7,10,'Circuit_connections.jpeg','UPLOAD','2026-05-24 11:32:43','SUCCESS'),(8,10,'images','FOLDER_CREATE','2026-05-24 11:53:25','SUCCESS'),(9,10,'documents','FOLDER_CREATE','2026-05-24 12:32:12','SUCCESS');
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `files`
--

DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `files` (
  `file_id` int NOT NULL AUTO_INCREMENT,
  `file_name` varchar(100) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `uploaded_date` date DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `folder_id` varchar(255) DEFAULT NULL,
  `server_id` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`file_id`),
  KEY `user_id` (`user_id`),
  KEY `folder_id` (`folder_id`),
  KEY `server_id` (`server_id`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `files`
--

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
INSERT INTO `files` VALUES (4,'image2.png','image/png','0.8 MB','2026-05-16','/uploads',1,'4','1',0,NULL),(5,'Module 1.pdf','application/pdf','6.4 MB','2026-05-17','/uploads',1,'2','1',0,NULL),(6,NULL,NULL,NULL,'2026-05-20',NULL,NULL,NULL,NULL,0,NULL),(7,NULL,NULL,NULL,'2026-05-20',NULL,NULL,NULL,NULL,0,NULL),(8,'logo.png','Image','1383802','2026-05-21','/uploads',10,'4','1',0,NULL),(9,'image2.png','Image','883820','2026-05-21','/uploads',10,NULL,'1',0,NULL),(10,'Screenshot (9).png','Image','2162398','2026-05-22','/uploads',10,'4','1',1,'2026-05-24 06:58:47'),(11,'Screenshot (2).png','Image','654609','2026-05-22','/uploads',10,'2','1',0,NULL),(12,'Document (1).docx','Document','231928','2026-05-24','/uploads',10,'6','1',0,NULL),(13,'tamil.jpeg','Image','191967','2026-05-24','/uploads',10,'1','1',1,'2026-05-24 06:45:15'),(14,'Circuit_connections.jpeg','Image','0.1 MB','2026-05-24','Root',10,'5','1',0,NULL);
/*!40000 ALTER TABLE `files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `folders`
--

DROP TABLE IF EXISTS `folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `folders` (
  `folder_id` int NOT NULL AUTO_INCREMENT,
  `folder_name` varchar(100) DEFAULT NULL,
  `folder_size` varchar(50) DEFAULT NULL,
  `created_date` date DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `no_of_files` int DEFAULT NULL,
  `server_id` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`folder_id`),
  KEY `user_id` (`user_id`),
  KEY `server_id` (`server_id`),
  CONSTRAINT `folders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folders`
--

LOCK TABLES `folders` WRITE;
/*!40000 ALTER TABLE `folders` DISABLE KEYS */;
INSERT INTO `folders` VALUES (2,'Main Folder','7.02 MB','2026-05-16',1,2,'1',0,NULL),(4,'photos','0 MB','2026-05-21',10,0,'1',1,'2026-05-24 06:59:38'),(5,'images','0 MB','2026-05-24',10,0,'1',1,'2026-05-24 07:11:44'),(6,'documents','0 MB','2026-05-24',10,0,'1',1,'2026-05-24 07:11:47');
/*!40000 ALTER TABLE `folders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `storage_server`
--

DROP TABLE IF EXISTS `storage_server`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `storage_server` (
  `server_id` varchar(255) NOT NULL,
  `server_name` varchar(100) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `total_storage` varchar(50) DEFAULT NULL,
  `used_storage` varchar(50) DEFAULT NULL,
  `server_status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`server_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `storage_server`
--

LOCK TABLES `storage_server` WRITE;
/*!40000 ALTER TABLE `storage_server` DISABLE KEYS */;
INSERT INTO `storage_server` VALUES ('1','Server-1','192.168.1.1','100 TB','0.0101 GB','Active'),('2','Server-2','192.168.1.2','50 TB','0 TB','Offline');
/*!40000 ALTER TABLE `storage_server` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','user@123','123','Admin'),(2,'Admin','admin@777','777','Admin'),(3,'Admin','admin@150','$2b$10$GSu0ZnffoxE8amKGnjap3O6K7dBlGM.I.fN7TQ2TcRJl9NTTDhRdS','Admin'),(4,'Admin','admin@150','$2b$10$bhH5D824SbB6ertquShIteN8qeBVggXYahfRWPzfVectO4GY6frba','Admin'),(5,'Admin','admin@150','$2b$10$T7M0tNMJqb57PROkAIhan.gXETiXII0s/glUV3RcX790jMuWM8Wvq','Admin'),(6,'Admin','admin@150','$2b$10$.OauAmfZnFN73/W5d2s7L.XcxryOCgT8wpXBi8CumuOqZk.G5M58.','Admin'),(7,'Admin','admin@150','$2b$10$nZ/vsk7TQdsGhS4bzya.rechNqKJ4tRG2iH/4GWRIvjKx7e.OW1NW','Admin'),(8,'Admin','admin@777','$2b$10$rq7Ftbi1d93zrGi8i8v.kOyM7gaK.0gCsBlTwhlZhXNXIPQYLoSHG','Admin'),(9,'Admin','admin@777','$2b$10$naOusfKjayyowb7zRWUqNePPp1amiLqFM7I1eNVIpO9knEJdz4al.','Admin'),(10,'Admin','admin_sys_01','$2b$10$q6hpjX1mwLt1yDqr67VayeddDrqLNps.ALJu2PcI6KnSW/hwJLEKq','Admin'),(11,'Admin','admin_sys_02','$2b$10$Grd4/RHu2l9FNLywCYKYq.Ui0B7Df5YqH/vNUvkwTRQcFFggLpN1W','Admin'),(12,'Admin','admin_sys_03','$2b$10$JQ6ezp7Vd7/GrXG4eg47Qeratd9fmyeZx1Z52JgclED/I4wggNI1S','Admin');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-24 15:27:17
