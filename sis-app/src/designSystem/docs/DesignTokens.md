# Design System Tokens Reference

This document provides a quick reference for all design tokens available in the SIS Design System.

## Colors

### Primary Palette
- `primary.50` - `#e3f2fd`
- `primary.100` - `#bbdefb`
- `primary.200` - `#90caf9`
- `primary.300` - `#64b5f6`
- `primary.400` - `#42a5f5`
- `primary.500` - `#2196f3`
- `primary.600` - `#1e88e5`
- `primary.700` - `#1976d2` (main)
- `primary.800` - `#1565c0`
- `primary.900` - `#0d47a1`

### Secondary Palette
- `secondary.50` - `#fce4ec`
- `secondary.100` - `#f8bbd0`
- `secondary.200` - `#f48fb1`
- `secondary.300` - `#f06292`
- `secondary.400` - `#ec407a`
- `secondary.500` - `#e91e63`
- `secondary.600` - `#d81b60`
- `secondary.700` - `#c2185b` (main)
- `secondary.800` - `#ad1457`
- `secondary.900` - `#880e4f`

### Neutral/Grey Palette
- `neutral.50` - `#fafafa`
- `neutral.100` - `#f5f5f5`
- `neutral.200` - `#eeeeee`
- `neutral.300` - `#e0e0e0`
- `neutral.400` - `#bdbdbd`
- `neutral.500` - `#9e9e9e`
- `neutral.600` - `#757575`
- `neutral.700` - `#616161`
- `neutral.800` - `#424242`
- `neutral.900` - `#212121`

### Status Colors
- `success` - `#4caf50`
- `warning` - `#ff9800`
- `error` - `#f44336`
- `info` - `#2196f3`

## Typography

### Font Families
- **Base**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- **Mono**: Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace

### Font Sizes
- `xs` - `0.75rem` (12px)
- `sm` - `0.875rem` (14px)
- `base` - `1rem` (16px)
- `lg` - `1.125rem` (18px)
- `xl` - `1.25rem` (20px)
- `2xl` - `1.5rem` (24px)
- `3xl` - `1.875rem` (30px)
- `4xl` - `2.25rem` (36px)
- `5xl` - `3rem` (48px)

### Font Weights
- `light` - 300
- `regular` - 400
- `medium` - 500
- `semibold` - 600
- `bold` - 700

### Line Heights
- `tight` - 1.2
- `base` - 1.5
- `relaxed` - 1.75

## Spacing

Based on 4px grid system:
- `0` - 0
- `1` - 4px
- `2` - 8px
- `3` - 12px
- `4` - 16px
- `5` - 20px
- `6` - 24px
- `7` - 28px
- `8` - 32px
- `9` - 36px
- `10` - 40px
- `12` - 48px
- `16` - 64px
- `20` - 80px
- `24` - 96px

## Border Radius
- `none` - 0
- `sm` - 4px
- `base` - 8px
- `md` - 12px
- `lg` - 16px
- `xl` - 24px
- `full` - 9999px

## Breakpoints
- `xs` - 0px
- `sm` - 600px
- `md` - 900px
- `lg` - 1200px
- `xl` - 1536px

## Elevation/Shadows
- `0` - none
- `1` - 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
- `2` - 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- `3` - 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- `4` - 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)

## Z-Index
- `mobileStepper` - 1000
- `speedDial` - 1050
- `appBar` - 1100
- `drawer` - 1200
- `modal` - 1300
- `snackbar` - 1400
- `tooltip` - 1500

## Layout
- `sidebarWidth` - 280px
- `sidebarCollapsedWidth` - 72px
- `headerHeight` - 64px

## Transitions

### Duration (ms)
- `shortest` - 150
- `shorter` - 200
- `short` - 250
- `standard` - 300
- `complex` - 375
- `enteringScreen` - 225
- `leavingScreen` - 195

### Easing
- `easeInOut` - cubic-bezier(0.4, 0, 0.2, 1)
- `easeOut` - cubic-bezier(0.0, 0, 0.2, 1)
- `easeIn` - cubic-bezier(0.4, 0, 1, 1)
- `sharp` - cubic-bezier(0.4, 0, 0.6, 1)