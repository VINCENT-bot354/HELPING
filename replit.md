# URL Ping Monitor Application

## Overview

This is a full-stack URL monitoring application built with React frontend and Express backend. The system continuously monitors a list of URLs by pinging them at regular intervals, tracks their status (online/offline/warning), and provides real-time updates through WebSocket connections. Users can add and manage URLs to monitor, view current ping statistics, and see live monitoring activity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket client for receiving live ping status updates
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful API with dedicated routes for URL management
- **Real-time Communication**: WebSocket server for broadcasting live updates
- **Data Storage**: In-memory storage with file persistence (MemStorage class)
- **Background Processing**: Ping service that runs continuous monitoring cycles
- **Development Setup**: Vite integration for hot module replacement in development

### Data Storage Solutions
- **Primary Storage**: Custom in-memory storage implementation with Map-based data structures
- **Persistence**: JSON file-based persistence for data durability across restarts
- **Database Schema**: Drizzle ORM configured for PostgreSQL (not currently used but ready for migration)
- **Data Models**: 
  - URLs with status tracking, response times, and error logging
  - Ping statistics with cycle information and daily counters

### Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Management**: Basic session handling infrastructure present via connect-pg-simple

### External Service Integrations
- **Monitoring Logic**: Custom HTTP ping implementation for URL health checks
- **UI Components**: Extensive use of Radix UI primitives for accessibility
- **Development Tools**: Replit-specific plugins for development environment integration

### Key Architectural Decisions

#### Monorepo Structure
- **Problem**: Managing frontend and backend code in a single repository
- **Solution**: Organized codebase with separate client/, server/, and shared/ directories
- **Benefits**: Shared TypeScript types and schemas, simplified deployment

#### Real-time Updates
- **Problem**: Users need live feedback on monitoring status
- **Solution**: WebSocket implementation with automatic reconnection
- **Benefits**: Immediate status updates without polling, better user experience

#### In-Memory Storage with Persistence
- **Problem**: Need fast data access without database complexity
- **Solution**: Memory-based storage with JSON file backup
- **Benefits**: High performance, simple setup, easy to migrate to database later
- **Trade-offs**: Limited to single server instance, potential data loss on crashes

#### Component Architecture
- **Problem**: Building consistent, accessible UI components
- **Solution**: Shadcn/ui component library with Radix UI foundation
- **Benefits**: Type-safe components, built-in accessibility, consistent design system

#### Background Service Design
- **Problem**: Continuous URL monitoring without blocking the main thread
- **Solution**: Separate ping service with configurable intervals and sequential processing
- **Benefits**: Controlled resource usage, predictable monitoring cycles