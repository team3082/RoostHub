import React from "react";

/**
 * Card component - A reusable container component with consistent styling
 * Provides a standardized card layout with background, border, shadow, and rounded corners
 * Used throughout the application for displaying content in a visually appealing card format
 */
interface CardProps {
  /** Content to be rendered inside the card */
  children: React.ReactNode;
  /** Additional CSS classes to apply to the card (optional) */
  className?: string;
}

/**
 * Card functional component
 * Renders a styled container with consistent design system styling
 * 
 * @param children - React nodes to render inside the card
 * @param className - Optional additional CSS classes
 * @returns Styled card component with children content
 */
const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div 
    className={`bg-[#F7F7F7] rounded-xl border border-[#E9E9E9] p-8 shadow-xl flex flex-col items-center max-w-2xl w-full ${className}`}
  >
    {children}
  </div>
);

export default Card;