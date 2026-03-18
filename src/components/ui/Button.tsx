import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'ghost' | 'category';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type CategoryColor = 'numbers' | 'hangul' | 'english' | 'games';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  categoryColor?: CategoryColor;
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-button hover:bg-primary-light active:bg-primary-dark active:shadow-button-pressed',
  secondary: 'bg-bg-warm text-text-dark border-2 border-primary-light/30 hover:border-primary-light/60',
  accent: 'bg-accent-orange text-white shadow-button hover:brightness-110',
  success: 'bg-success text-white shadow-button hover:brightness-110',
  ghost: 'bg-transparent text-primary hover:bg-bg-warm',
  category: '',
};

const categoryStyles: Record<CategoryColor, string> = {
  numbers: 'bg-numbers text-white shadow-button hover:brightness-110',
  hangul: 'bg-hangul text-white shadow-button hover:brightness-110',
  english: 'bg-english text-text-dark shadow-button hover:brightness-110',
  games: 'bg-games text-white shadow-button hover:brightness-110',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm rounded-radius-md gap-1.5',
  md: 'h-12 px-6 text-base rounded-button gap-2',
  lg: 'h-14 px-8 text-lg rounded-button gap-2.5',
  xl: 'h-16 px-10 text-xl rounded-radius-xl gap-3',
};

const iconSizes: Record<ButtonSize, string> = {
  sm: '[&_svg]:w-4 [&_svg]:h-4',
  md: '[&_svg]:w-5 [&_svg]:h-5',
  lg: '[&_svg]:w-6 [&_svg]:h-6',
  xl: '[&_svg]:w-7 [&_svg]:h-7',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      categoryColor,
      isLoading,
      disabled,
      icon,
      iconPosition = 'left',
      children,
      ...props
    },
    ref,
  ) => {
    const motionProps: HTMLMotionProps<'button'> = {
      whileTap: disabled ? undefined : { scale: 0.95 },
      transition: { type: 'spring', stiffness: 400, damping: 17 },
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          'select-none touch-manipulation',
          'min-h-[var(--min-touch)]',
          variant === 'category' && categoryColor
            ? categoryStyles[categoryColor]
            : variantStyles[variant],
          sizeStyles[size],
          iconSizes[size],
          className,
        )}
        style={{ '--min-touch': '44px' } as React.CSSProperties}
        disabled={disabled || isLoading}
        {...motionProps}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {isLoading ? (
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="shrink-0">{icon}</span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && (
              <span className="shrink-0">{icon}</span>
            )}
          </>
        )}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
