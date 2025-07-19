# NutriCoach - Product Requirements Document

## Executive Summary

NutriCoach is an AI-powered nutrition tracking application that simplifies meal logging through natural language processing and voice input. Users can effortlessly track their nutritional intake, set health goals, and receive personalized insights through an intuitive dashboard.

## Product Overview

### Vision
To make nutrition tracking as simple as having a conversation, empowering users to achieve their health goals through AI-driven insights and effortless meal logging.

### Core Value Propositions
1. **Natural Language Meal Logging**: Type or speak what you ate in plain language
2. **AI-Powered Nutritional Analysis**: Automatic parsing of complex meals and portions
3. **Comprehensive Goal Tracking**: Support for weight, macro, and calorie goals
4. **Actionable Insights**: Daily summaries and nutritional gap analysis
5. **Mobile-First Experience**: Seamless tracking on any device

## User Personas

### Primary Persona: Health-Conscious Individual
- **Age**: 25-45
- **Tech Savvy**: Comfortable with apps and voice interfaces
- **Pain Points**: 
  - Traditional calorie counting apps are tedious
  - Difficult to log home-cooked meals
  - Lack of comprehensive nutritional insights
- **Goals**: Weight management, balanced nutrition, healthy habits

### Secondary Persona: Fitness Enthusiast
- **Age**: 20-40
- **Characteristics**: Tracks macros, follows specific diets
- **Needs**: Detailed macro tracking, goal progress visualization

## Core Features (MVP)

### 1. Authentication & Onboarding
- **Implementation**: Better Auth with email/password and social providers
- **User Profile Setup**:
  - Basic information (age, gender, height, weight)
  - Activity level selection
  - Goal setting wizard
  - Dietary preferences/restrictions

### 2. Meal Logging

#### Text Input
- Natural language input field
- Examples: "I had a slice of lasagna", "1 medium apple and 2 scrambled eggs"
- Real-time AI processing with loading states

#### Voice Input
- Web Speech API integration
- Push-to-talk or continuous listening modes
- Visual feedback during recording
- Transcription preview before confirmation

#### AI Processing (OpenAI Integration)
```typescript
interface FoodItem {
  name: string
  quantity: number
  unit: string
  calories: number
  macros: {
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  minerals: {
    sodium: number
    potassium: number
    calcium: number
    iron: number
    // ... other key minerals
  }
  vitamins: Record<string, number>
}
```

### 3. Dashboard

#### Overview Cards
- Today's calorie intake vs goal
- Macro distribution (circular chart)
- Water intake tracker
- Quick add buttons for common items

#### Analytics Views
1. **Calorie Trends**
   - Daily/Weekly/Monthly views
   - Line charts with goal reference line
   - Heat map calendar view

2. **Weight Progress**
   - Progress chart with trend line
   - Goal milestone markers
   - Weekly/Monthly averages

3. **Macro Distribution**
   - Pie/donut charts for daily macros
   - Stacked bar charts for weekly trends
   - Comparison to recommended ratios

4. **Nutritional Analysis**
   - Deficiency warnings (red indicators)
   - Surplus alerts (yellow indicators)
   - Recommendations for balance

### 4. Goals Management

#### Supported Goal Types
```typescript
interface UserGoals {
  weight: {
    target: number
    targetDate: Date
    weeklyChange: number // -2 to +2 lbs
  }
  calories: {
    daily: number
    method: 'manual' | 'calculated'
  }
  macros: {
    protein: { grams: number; percentage: number }
    carbs: { grams: number; percentage: number }
    fat: { grams: number; percentage: number }
  }
  dietary: {
    type: 'standard' | 'keto' | 'paleo' | 'vegan' | 'vegetarian'
    restrictions: string[]
    allergies: string[]
  }
}
```

### 5. Daily Summaries (Inngest Integration)

#### Summary Contents
- Total calories consumed vs goal
- Macro breakdown and goal adherence
- Top 3 nutritional achievements
- Areas for improvement
- Tomorrow's focus suggestions
- Hydration reminder

## Technical Architecture

### Tech Stack (Aligned with Existing Codebase)

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query + tRPC
- **Forms**: React Hook Form + Zod
- **Voice Input**: Web Speech API

#### Backend
- **API**: tRPC procedures
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **AI Integration**: OpenAI API
- **Background Jobs**: Inngest
- **Deployment**: Vercel

### Database Schema

```typescript
// Core tables extending existing auth tables
export const nutritionProfiles = pgTable('nutrition_profiles', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').notNull().references(() => user.id),
  height: integer('height'), // cm
  weight: numeric('weight', { precision: 5, scale: 2 }), // kg
  activityLevel: text('activity_level'), // sedentary, light, moderate, active
  dateOfBirth: date('date_of_birth'),
  gender: text('gender'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
})

export const goals = pgTable('goals', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').notNull().references(() => user.id),
  type: text('type').notNull(), // weight, calories, macros
  target: jsonb('target').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
})

export const meals = pgTable('meals', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').notNull().references(() => user.id),
  name: text('name').notNull(),
  type: text('type'), // breakfast, lunch, dinner, snack
  loggedAt: timestamp('logged_at').notNull(),
  rawInput: text('raw_input'), // original text/voice input
  inputMethod: text('input_method'), // text, voice
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
})

export const foodItems = pgTable('food_items', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  mealId: text('meal_id').notNull().references(() => meals.id),
  name: text('name').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }),
  unit: text('unit'),
  calories: integer('calories'),
  protein: numeric('protein', { precision: 10, scale: 2 }),
  carbs: numeric('carbs', { precision: 10, scale: 2 }),
  fat: numeric('fat', { precision: 10, scale: 2 }),
  fiber: numeric('fiber', { precision: 10, scale: 2 }),
  nutritionData: jsonb('nutrition_data'), // complete nutritional profile
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
})

export const dailySummaries = pgTable('daily_summaries', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').notNull().references(() => user.id),
  date: date('date').notNull(),
  totalCalories: integer('total_calories'),
  macros: jsonb('macros'),
  insights: jsonb('insights'),
  recommendations: text('recommendations'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
})

export const weightLogs = pgTable('weight_logs', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').notNull().references(() => user.id),
  weight: numeric('weight', { precision: 5, scale: 2 }).notNull(),
  loggedAt: timestamp('logged_at').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
})
```

### API Structure (tRPC Procedures)

```typescript
// modules/nutrition/server/procedures.ts
export const nutritionRouter = createTRPCRouter({
  // Meal management
  logMeal: protectedProcedure
    .input(mealLogSchema)
    .mutation(async ({ input, ctx }) => {
      // Process with OpenAI
      // Save meal and food items
      // Return nutritional data
    }),
  
  getMeals: protectedProcedure
    .input(getMealsSchema)
    .query(async ({ input, ctx }) => {
      // Paginated meals with filters
    }),
  
  // Dashboard data
  getDashboardStats: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      // Aggregate nutritional data
    }),
  
  // Goals
  setGoal: protectedProcedure
    .input(goalSchema)
    .mutation(async ({ input, ctx }) => {
      // Create or update goals
    }),
  
  // Weight tracking
  logWeight: protectedProcedure
    .input(weightLogSchema)
    .mutation(async ({ input, ctx }) => {
      // Log weight entry
    }),
})
```

### AI Integration Pattern

```typescript
// modules/nutrition/lib/ai-processor.ts
export async function processFoodInput(input: string): Promise<FoodItem[]> {
  const prompt = `
    Parse the following food description into structured nutritional data:
    "${input}"
    
    Return a JSON array of food items with:
    - name, quantity, unit
    - calories, protein, carbs, fat, fiber
    - key minerals and vitamins
    
    Examples:
    "a slice of lasagna" -> [{name: "lasagna", quantity: 1, unit: "slice (140g)", calories: 320, ...}]
    "apple" -> [{name: "apple", quantity: 1, unit: "medium (182g)", calories: 95, ...}]
  `;
  
  // OpenAI call with structured output
  // Validation and error handling
  // Return parsed food items
}
```

## UI/UX Design Guidelines

### Design Principles
1. **Mobile-First**: All interfaces optimized for mobile devices
2. **Minimal Friction**: Maximum 2 taps to log a meal
3. **Visual Feedback**: Clear loading states and confirmations
4. **Data Density**: Rich information without overwhelming

### Key Screens

#### 1. Dashboard (Home)
- Top section: Daily summary card with circular progress
- Quick actions: Log meal, Log weight, Add water
- Recent meals list with edit/delete options
- Bottom navigation: Home, Meals, Analytics, Profile

#### 2. Meal Logging
- Large input area (text/voice toggle)
- Recent/frequent foods for quick add
- AI processing feedback
- Nutritional preview before saving

#### 3. Analytics
- Tab navigation: Calories, Weight, Macros, Nutrition
- Interactive charts with tooltips
- Date range selector
- Export options

#### 4. Profile & Goals
- Current stats overview
- Active goals with progress
- Settings and preferences
- Data export/import options

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project setup with existing stack
- [ ] Database schema implementation
- [ ] Authentication integration
- [ ] Basic profile and goals setup

### Phase 2: Core Features (Weeks 3-4)
- [ ] Text-based meal logging
- [ ] OpenAI integration for food parsing
- [ ] Basic dashboard with calorie tracking
- [ ] Simple meal history view

### Phase 3: Enhanced Features (Weeks 5-6)
- [ ] Voice input integration
- [ ] Complete dashboard analytics
- [ ] Weight tracking
- [ ] Inngest daily summaries

### Phase 4: Polish & PWA (Week 7)
- [ ] PWA configuration
- [ ] Offline support for viewing data
- [ ] Performance optimization
- [ ] Testing and bug fixes

### Phase 5: Launch Preparation (Week 8)
- [ ] Beta testing
- [ ] Documentation
- [ ] Deployment setup
- [ ] Launch!

## Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Meals logged per user per day
- Voice vs text input ratio
- Goal completion rates

### Technical Performance
- AI parsing accuracy (>90%)
- Page load times (<2s)
- API response times (<200ms)
- Offline functionality coverage

### Business Metrics
- User retention (30-day)
- Premium conversion rate (future)
- User satisfaction (NPS)

## Future Enhancements (Post-MVP)
1. Barcode scanning
2. Photo-based food recognition
3. Recipe database and meal planning
4. Social features (share progress)
5. Integration with fitness trackers
6. Premium AI coaching features
7. Native mobile apps

## Risk Mitigation

### Technical Risks
- **AI Accuracy**: Implement user correction mechanism
- **API Costs**: Cache common foods, implement rate limiting
- **Data Privacy**: Encrypt sensitive health data

### User Experience Risks
- **Onboarding Complexity**: Progressive disclosure
- **Voice Input Accuracy**: Provide easy editing options
- **Information Overload**: Customizable dashboard widgets

---

This PRD provides a comprehensive blueprint for building NutriCoach while maintaining alignment with your existing codebase patterns and technical stack. The phased approach ensures quick MVP delivery while setting up for future enhancements.