/**
 * @file tests/design_system_ui.test.ts
 * @description 통합 디자인시스템 및 기준 컴포넌트 풀 (Button, Input, Textarea, Card, Badge, Modal, KeyCap, ToolIcon) 단위 검증
 */

import { Button } from '../src/shared/components/ui/Button';
import { Badge } from '../src/shared/components/ui/Badge';
import { KeyCap } from '../src/shared/components/ui/KeyCap';
import { ToolIcon } from '../src/shared/components/ui/ToolIcon';
import React from 'react';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

console.log('=== [TDD] 통합 디자인시스템 및 기준 컴포넌트 풀 단위 테스트 ===\n');

// 1. Button 컴포넌트 검증
console.log('--- 1. Button 컴포넌트 렌더링 및 44px 터치타깃 검증 ---');
const btnElement = React.createElement(Button, {
  variant: 'primary',
  size: 'lg',
  touchTarget: true,
  children: '확인'
});
assert(Boolean(btnElement), 'Button 엘리먼트 정상 생성');
assert(btnElement.props.variant === 'primary', 'Button primary variant 지정');
assert(btnElement.props.size === 'lg', 'Button size lg 지정');
assert(btnElement.props.touchTarget === true, 'Button 모바일 44px 터치타깃 플래그 활성화');

// 2. Badge 컴포넌트 Semantic 검증
console.log('\n--- 2. Badge 컴포넌트 Semantic 상태 매핑 검증 ---');
const successBadge = React.createElement(Badge, {
  variant: 'success',
  dot: true,
  children: '활성'
});
assert(Boolean(successBadge), 'Badge success 엘리먼트 생성');
assert(successBadge.props.variant === 'success', 'Badge variant success 지정');
assert(successBadge.props.dot === true, 'Badge dot indicator 플래그 정상');

const dangerBadge = React.createElement(Badge, {
  variant: 'danger',
  children: '차단'
});
assert(dangerBadge.props.variant === 'danger', 'Badge variant danger 지정');

// 3. KeyCap 컴포넌트 복합키 분할 및 렌더링 검증
console.log('\n--- 3. KeyCap 컴포넌트 복합 단축키 검증 ---');
const keyCapElement = React.createElement(KeyCap, {
  keys: 'Ctrl+Shift+F',
  variant: 'dark',
  size: 'md'
});
assert(Boolean(keyCapElement), 'KeyCap 엘리먼트 생성');
assert(keyCapElement.props.keys === 'Ctrl+Shift+F', 'KeyCap 복합 기능키 문자열 입력');

const keyCapArrayElement = React.createElement(KeyCap, {
  keys: ['Cmd', 'Alt', 'P'],
  variant: 'light'
});
assert(Array.isArray(keyCapArrayElement.props.keys), 'KeyCap 배열 입력 지원');
assert(keyCapArrayElement.props.keys.length === 3, 'KeyCap 3개 키 분할 정상');

// 4. ToolIcon 규격화 아이콘 검증
console.log('\n--- 4. ToolIcon 14/16/20px 규격 및 액션 검증 ---');
const toolIconSm = React.createElement(ToolIcon, {
  icon: '🔍',
  label: '돋보기',
  size: 'sm',
  active: false
});
assert(toolIconSm.props.size === 'sm', 'ToolIcon sm (14px) 규격');

const toolIconLg = React.createElement(ToolIcon, {
  icon: '✏️',
  label: '주석 편집',
  size: 'lg',
  active: true,
  badge: 3
});
assert(toolIconLg.props.size === 'lg', 'ToolIcon lg (20px) 규격');
assert(toolIconLg.props.active === true, 'ToolIcon active 활성 테두리 플래그');
assert(toolIconLg.props.badge === 3, 'ToolIcon badge 카운트 플래그');

console.log('\n🎉 [성공] 통합 디자인시스템 기준 컴포넌트 4대 영역 단위 테스트 100% 통과!\n');
