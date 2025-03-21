import React, {
  ComponentPropsWithRef,
  forwardRef,
  JSXElementConstructor,
} from 'react';
import clsx from 'clsx';
import type {RelativeRoutingType, To} from 'react-router';
import {
  ButtonColor,
  ButtonVariant,
  getSharedButtonStyle,
} from './get-shared-button-style';
import {createEventHandler} from '@ui/utils/dom/create-event-handler';

export interface ButtonBaseProps
  extends Omit<ComponentPropsWithRef<'button'>, 'color'> {
  color?: ButtonColor;
  variant?: ButtonVariant;
  value?: any;
  justify?: string;
  display?: string;
  radius?: string;
  shadow?: string;
  border?: string;
  whitespace?: string;
  form?: string;
  to?: To;
  state?: any;
  relative?: RelativeRoutingType;
  href?: string;
  target?: '_blank';
  rel?: string;
  replace?: boolean;
  end?: boolean;
  elementType?: 'button' | 'a' | 'div' | JSXElementConstructor<any>;
  download?: boolean | string;
}

export const ButtonBase = forwardRef<
  HTMLButtonElement | HTMLLinkElement,
  ButtonBaseProps
>((props, ref) => {
  const {
    children,
    color = null,
    variant,
    radius,
    shadow,
    whitespace,
    justify = 'justify-center',
    className,
    href,
    form,
    border,
    elementType,
    to,
    state,
    relative,
    replace,
    end,
    display,
    type = 'button',
    onClick,
    onPointerDown,
    onPointerUp,
    onKeyDown,
    ...domProps
  } = props;
  const Element = elementType || (href ? 'a' : 'button');
  const isLink = Element === 'a';

  return (
    <Element
      ref={ref as any}
      form={isLink ? undefined : form}
      href={href}
      to={to}
      state={state}
      relative={relative}
      type={isLink ? undefined : type}
      replace={replace}
      end={end}
      onPointerDown={createEventHandler(onPointerDown)}
      onPointerUp={createEventHandler(onPointerUp)}
      onClick={createEventHandler(onClick)}
      onKeyDown={createEventHandler(onKeyDown)}
      className={clsx(
        'focus-visible:ring',
        getSharedButtonStyle({
          variant,
          color,
          border,
          whitespace,
          display,
          shadow,
        }),
        radius,
        justify,
        className,
      )}
      {...domProps}
    >
      {children}
    </Element>
  );
});
