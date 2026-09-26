/* @ds-bundle: {"format":4,"namespace":"LeGrandPronoDesignSystem_2fc6cd","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"CandidateCard","sourcePath":"components/display/CandidateCard.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Countdown","sourcePath":"components/display/Countdown.jsx"},{"name":"LeaderboardRow","sourcePath":"components/display/LeaderboardRow.jsx"},{"name":"PointsChip","sourcePath":"components/display/PointsChip.jsx"},{"name":"ProgressBar","sourcePath":"components/display/ProgressBar.jsx"},{"name":"PronoCard","sourcePath":"components/display/PronoCard.jsx"},{"name":"StatTile","sourcePath":"components/display/StatTile.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"39ac23516561","components/core/Badge.jsx":"03431a5d2974","components/core/Button.jsx":"5d50de7f72d8","components/core/Icon.jsx":"87d68fe798e7","components/core/IconButton.jsx":"8d7ffb9d3982","components/display/CandidateCard.jsx":"d2237ead8f0d","components/display/Card.jsx":"410022c9f4ac","components/display/Countdown.jsx":"1135116288ea","components/display/LeaderboardRow.jsx":"1e7ae7737314","components/display/PointsChip.jsx":"4de0598e698b","components/display/ProgressBar.jsx":"d59e17e95bfe","components/display/PronoCard.jsx":"b35ad3fda5dd","components/display/StatTile.jsx":"0fb7448379fb","components/feedback/Dialog.jsx":"68d812ae329e","components/feedback/Toast.jsx":"4b3184760350","components/forms/Checkbox.jsx":"632437d1d286","components/forms/Input.jsx":"70e746e91eb9","components/forms/SegmentedControl.jsx":"e7239e262413","components/forms/Switch.jsx":"92dc5268ab6b","components/navigation/BottomNav.jsx":"9a5e56b0c944","components/navigation/Tabs.jsx":"0de9c0ea48bb","ui_kits/app/HomeScreen.jsx":"a3b3ee38a214","ui_kits/app/Phone.jsx":"2013ddb7e288","ui_kits/app/PickScreen.jsx":"b2346f52ffa3","ui_kits/app/ProfileScreen.jsx":"3cdc0026a4e1","ui_kits/app/PronosScreen.jsx":"6baf84ebc263","ui_kits/app/RankScreen.jsx":"0d802970daac","ui_kits/app/SeasonScreen.jsx":"58a5a07c213f","ui_kits/app/data.jsx":"3698cad77068","ui_kits/web/Dashboard.jsx":"e44d43202259","ui_kits/web/Landing.jsx":"c7728f80971f","ui_kits/web/SiteNav.jsx":"f3c11677d69b"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LeGrandPronoDesignSystem_2fc6cd = window.LeGrandPronoDesignSystem_2fc6cd || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
const HUES = [['#d243e6', '#4a24c8'], ['#ff8a1f', '#b42ccc'], ['#63d9ff', '#6a3cf0'], ['#ffcb5c', '#e8650c'], ['#8b67ff', '#24106a']];
function Avatar({
  name = '',
  src,
  size = 40,
  ring,
  className,
  style
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const h = HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % HUES.length];
  return /*#__PURE__*/React.createElement("span", {
    className: cx('gp-avatar', ring && 'gp-avatar--ring-' + ring, className),
    style: {
      width: size,
      height: size,
      fontSize: Math.round(size * 0.38),
      background: src ? 'none' : 'linear-gradient(140deg,' + h[0] + ',' + h[1] + ')',
      ...style
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Icon({
  name,
  size = 20,
  color,
  className = '',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("i", _extends({
    "aria-hidden": "true",
    className: 'gp-icon icon-' + name + (className ? ' ' + className : ''),
    style: {
      fontSize: size,
      width: size,
      height: size,
      color,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function Badge({
  tone = 'neutral',
  icon,
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: 'gp-badge gp-badge--' + tone
  }, tone === 'live' && /*#__PURE__*/React.createElement("span", {
    className: "gp-badge__dot"
  }), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 12
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block,
  disabled,
  children,
  className,
  ...rest
}) {
  const is = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cx('gp-btn', 'gp-btn--' + variant, 'gp-btn--' + size, block && 'gp-btn--block', className),
    disabled: disabled
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: is
  }), children != null && /*#__PURE__*/React.createElement("span", null, children), iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: is
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function IconButton({
  icon,
  variant = 'glass',
  size = 44,
  dot,
  label,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    className: cx('gp-iconbtn', 'gp-iconbtn--' + variant, className),
    style: {
      width: size,
      height: size,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: Math.round(size * 0.45)
  }), dot && /*#__PURE__*/React.createElement("span", {
    className: "gp-iconbtn__dot"
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/display/CandidateCard.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function CandidateCard({
  name,
  photo,
  meta,
  selected,
  eliminated,
  onSelect,
  size = 64
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: cx('gp-cand', selected && 'gp-cand--on', eliminated && 'gp-cand--out'),
    disabled: eliminated,
    "aria-pressed": !!selected,
    onClick: () => !eliminated && onSelect && onSelect()
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-cand__tick"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14
  })), /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    src: photo,
    size: size,
    ring: selected ? 'flare' : undefined
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-cand__name"
  }, name), meta && /*#__PURE__*/React.createElement("span", {
    className: "gp-cand__meta"
  }, meta)));
}
Object.assign(__ds_scope, { CandidateCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/CandidateCard.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Card({
  variant = 'glass',
  padding = 16,
  interactive,
  className,
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cx('gp-card', 'gp-card--' + variant, interactive && 'gp-card--interactive', className),
    style: {
      padding,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Countdown.jsx
try { (() => {
const pad = n => String(n).padStart(2, '0');
function Countdown({
  to,
  seconds,
  size = 'md',
  labels = ['J', 'H', 'Min', 'Sec'],
  showDays = true
}) {
  const target = React.useMemo(() => to ? new Date(to).getTime() : Date.now() + (seconds || 0) * 1000, [to, seconds]);
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  let s = Math.max(0, Math.floor((target - now) / 1000));
  const parts = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
  const cells = showDays ? parts.map((v, i) => [v, labels[i]]) : parts.slice(1).map((v, i) => [v, labels[i + 1]]);
  return /*#__PURE__*/React.createElement("div", {
    className: 'gp-countdown' + (size === 'sm' ? ' gp-countdown--sm' : '')
  }, cells.map(([v, l], i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "gp-countdown__sep"
  }, ":"), /*#__PURE__*/React.createElement("span", {
    className: "gp-countdown__cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-countdown__num"
  }, pad(v)), size !== 'sm' && /*#__PURE__*/React.createElement("span", {
    className: "gp-countdown__lbl"
  }, l)))));
}
Object.assign(__ds_scope, { Countdown });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Countdown.jsx", error: String((e && e.message) || e) }); }

// components/display/LeaderboardRow.jsx
try { (() => {
function LeaderboardRow({
  rank,
  name,
  sub,
  avatar,
  points,
  move = 0,
  me
}) {
  const dir = move > 0 ? 'up' : move < 0 ? 'down' : 'flat';
  return /*#__PURE__*/React.createElement("div", {
    className: 'gp-lb' + (me ? ' gp-lb--me' : '')
  }, /*#__PURE__*/React.createElement("span", {
    className: 'gp-lb__rank' + (rank <= 3 ? ' gp-lb__rank--' + rank : '')
  }, rank), /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    src: avatar,
    size: 40,
    ring: rank === 1 ? 'gold' : me ? 'magenta' : undefined
  }), /*#__PURE__*/React.createElement("span", {
    className: "gp-lb__who"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-lb__name"
  }, name, me ? ' (toi)' : ''), sub && /*#__PURE__*/React.createElement("span", {
    className: "gp-lb__sub"
  }, sub)), /*#__PURE__*/React.createElement("span", {
    className: 'gp-lb__move gp-lb__move--' + dir
  }, dir === 'flat' ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "minus",
    size: 14
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: dir === 'up' ? 'chevron-up' : 'chevron-down',
    size: 14
  }), Math.abs(move))), /*#__PURE__*/React.createElement("span", {
    className: "gp-lb__pts"
  }, points, /*#__PURE__*/React.createElement("small", null, "pts")));
}
Object.assign(__ds_scope, { LeaderboardRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/LeaderboardRow.jsx", error: String((e && e.message) || e) }); }

// components/display/PointsChip.jsx
try { (() => {
function PointsChip({
  value,
  tone,
  size = 'md',
  icon,
  suffix = 'pts'
}) {
  const t = tone || (typeof value === 'number' ? value > 0 ? 'gain' : value < 0 ? 'loss' : 'neutral' : 'gold');
  const txt = typeof value === 'number' ? (value > 0 ? '+' : value < 0 ? '−' : '') + Math.abs(value) : value;
  return /*#__PURE__*/React.createElement("span", {
    className: 'gp-points gp-points--' + t + (size === 'lg' ? ' gp-points--lg' : '')
  }, /*#__PURE__*/React.createElement("span", null, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'lg' ? 16 : 13
  }), txt, suffix ? ' ' + suffix : ''));
}
Object.assign(__ds_scope, { PointsChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/PointsChip.jsx", error: String((e && e.message) || e) }); }

// components/display/ProgressBar.jsx
try { (() => {
function ProgressBar({
  value = 0,
  max = 100,
  tone = 'flare',
  label,
  valueLabel
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", {
    className: 'gp-progress gp-progress--' + tone
  }, (label || valueLabel) && /*#__PURE__*/React.createElement("div", {
    className: "gp-progress__head"
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("b", null, valueLabel != null ? valueLabel : value + '/' + max)), /*#__PURE__*/React.createElement("div", {
    className: "gp-progress__track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-progress__fill",
    style: {
      width: pct + '%'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/display/PronoCard.jsx
try { (() => {
const ST = {
  open: ['open', 'Ouvert'],
  done: ['magenta', 'Joué'],
  closed: ['closed', 'Fermé'],
  won: ['gold', 'Gagné'],
  live: ['live', 'En direct']
};
function PronoCard({
  question,
  status = 'open',
  points,
  deadline,
  pick,
  icon = 'sparkles',
  onClick
}) {
  const [tone, lbl] = ST[status] || ST.open;
  return /*#__PURE__*/React.createElement("button", {
    className: "gp-prono",
    onClick: onClick
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-prono__top"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: tone
  }, lbl), points != null && /*#__PURE__*/React.createElement(__ds_scope.PointsChip, {
    value: points,
    tone: status === 'won' ? 'gain' : 'gold',
    icon: "star"
  })), /*#__PURE__*/React.createElement("div", {
    className: "gp-prono__q"
  }, question), /*#__PURE__*/React.createElement("div", {
    className: "gp-prono__foot"
  }, pick ? /*#__PURE__*/React.createElement("span", {
    className: "gp-prono__pick"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "circle-check",
    size: 14
  }), pick) : /*#__PURE__*/React.createElement("span", {
    className: "gp-prono__pick"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }), "Pas encore jou\xE9"), deadline && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "clock",
    size: 13
  }), deadline), !deadline && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 16
  })));
}
Object.assign(__ds_scope, { PronoCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/PronoCard.jsx", error: String((e && e.message) || e) }); }

// components/display/StatTile.jsx
try { (() => {
function StatTile({
  label,
  value,
  trend,
  trendDir = 'up',
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "gp-stat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-stat__val",
    style: accent ? {
      color: accent
    } : null
  }, value), /*#__PURE__*/React.createElement("span", {
    className: "gp-stat__lbl"
  }, label), trend && /*#__PURE__*/React.createElement("span", {
    className: 'gp-stat__trend gp-stat__trend--' + trendDir
  }, trend));
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open = true,
  title,
  children,
  actions,
  onClose,
  icon
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "gp-dialog__scrim",
    onClick: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-dialog",
    role: "dialog",
    "aria-modal": "true"
  }, icon, title && /*#__PURE__*/React.createElement("h3", {
    className: "gp-dialog__title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "gp-dialog__body"
  }, children), actions && /*#__PURE__*/React.createElement("div", {
    className: "gp-dialog__actions"
  }, actions)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const IC = {
  success: 'check',
  points: 'star',
  error: 'x',
  info: 'bell'
};
function Toast({
  tone = 'success',
  title,
  message,
  icon
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'gp-toast gp-toast--' + tone,
    role: "status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-toast__ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || IC[tone],
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-toast__title"
  }, title), message && /*#__PURE__*/React.createElement("span", {
    className: "gp-toast__msg"
  }, message)));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked,
  onChange,
  label,
  disabled
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: 'gp-check' + (checked ? ' gp-check--on' : ''),
    style: disabled ? {
      opacity: .4,
      cursor: 'not-allowed'
    } : null
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "gp-check__box"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16
  })), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  hint,
  error,
  icon,
  id,
  ...rest
}) {
  const fid = id || (label ? 'in-' + label.replace(/\W+/g, '-').toLowerCase() : undefined);
  return /*#__PURE__*/React.createElement("div", {
    className: 'gp-field' + (error ? ' gp-field--error' : '')
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "gp-field__label",
    htmlFor: fid
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "gp-field__control"
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  }), /*#__PURE__*/React.createElement("input", _extends({
    id: fid
  }, rest))), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: "gp-field__hint"
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function SegmentedControl({
  options = [],
  value,
  onChange,
  block
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'gp-seg' + (block ? ' gp-seg--block' : ''),
    role: "tablist"
  }, options.map(o => {
    const v = typeof o === 'string' ? o : o.value,
      l = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": v === value,
      className: 'gp-seg__opt' + (v === value ? ' gp-seg__opt--on' : ''),
      onClick: () => onChange && onChange(v)
    }, l);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Switch({
  checked,
  onChange,
  label,
  disabled
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('gp-switch', checked && 'gp-switch--on', disabled && 'gp-switch--disabled')
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "gp-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-switch__thumb"
  })), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
function BottomNav({
  items = [],
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "gp-bnav"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.value,
    className: 'gp-bnav__item' + (it.value === value ? ' gp-bnav__item--on' : '') + (it.center ? ' gp-bnav__item--center' : ''),
    onClick: () => onChange && onChange(it.value)
  }, it.center ? /*#__PURE__*/React.createElement("span", {
    className: "gp-bnav__bubble"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 24
  })) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 22
  }), /*#__PURE__*/React.createElement("span", null, it.label))));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "gp-tabs",
    role: "tablist"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.value,
    role: "tab",
    "aria-selected": it.value === value,
    className: 'gp-tabs__tab' + (it.value === value ? ' gp-tabs__tab--on' : ''),
    onClick: () => onChange && onChange(it.value)
  }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
    className: "gp-tabs__count"
  }, it.count))));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/HomeScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function HomeScreen({
  go,
  played,
  openProno
}) {
  const {
    Avatar,
    IconButton,
    Card,
    Countdown,
    Button,
    PronoCard,
    LeaderboardRow,
    PointsChip,
    Badge,
    Icon
  } = window.LeGrandPronoDesignSystem_2fc6cd;
  const todo = WEEKLY.filter(w => !played[w.id]).length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      padding: '4px 20px 110px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Sam K",
    size: 44,
    ring: "magenta"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, "Les Stars du Canap\u2019"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h3)'
    }
  }, "Salut Sam")), /*#__PURE__*/React.createElement(PointsChip, {
    value: "371",
    tone: "gold",
    icon: "star"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    dot: true,
    label: "Notifications"
  })), /*#__PURE__*/React.createElement(Card, {
    variant: "stage",
    padding: 0
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'url(../../assets/key-art.jpg) 62% 40%/cover',
      opacity: .55
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg,rgba(23,6,67,.2),rgba(23,6,67,.92) 75%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '92px 18px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "gold"
  }, "Prime 6"), /*#__PURE__*/React.createElement(Badge, null, "Samedi 21h10")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h1)',
      fontSize: 28
    }
  }, "Les pronos ferment dans"), /*#__PURE__*/React.createElement(Countdown, {
    seconds: 2 * 86400 + 3 * 3600 + 1500
  }), /*#__PURE__*/React.createElement(Button, {
    block: true,
    size: "lg",
    iconRight: "arrow-right",
    onClick: () => go('pronos')
  }, todo ? 'Jouer mes ' + todo + ' pronos' : 'Voir mes pronos'))), /*#__PURE__*/React.createElement(Section, {
    title: "Pronos de la semaine",
    action: "Tout voir",
    onAction: () => go('pronos')
  }, WEEKLY.slice(0, 2).map(w => /*#__PURE__*/React.createElement(PronoCard, {
    key: w.id,
    question: w.question,
    points: w.points,
    deadline: played[w.id] ? null : w.deadline,
    status: played[w.id] ? 'done' : 'open',
    pick: played[w.id] && played[w.id].join(', '),
    onClick: () => openProno(w)
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Ta ligue",
    action: "Classement",
    onAction: () => go('rank')
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 6
  }, PLAYERS.slice(0, 3).map(p => /*#__PURE__*/React.createElement(LeaderboardRow, _extends({
    key: p.rank
  }, p))))), /*#__PURE__*/React.createElement(Card, {
    variant: "edge",
    padding: 16,
    interactive: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 14,
      background: 'var(--grad-gold)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#3a1a00',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "music-4",
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-overline",
    style: {
      color: 'var(--gold-400)'
    }
  }, "D\xE9fi bonus"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body)',
      fontWeight: 700
    }
  }, "Devine la chanson du trio de ce soir")), /*#__PURE__*/React.createElement(PointsChip, {
    value: "50",
    tone: "gold"
  }))));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Phone.jsx
try { (() => {
const {
  Icon: PIcon
} = window.LeGrandPronoDesignSystem_2fc6cd;
function Phone({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 390,
      height: 844,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--surface-page)',
      boxShadow: '0 0 0 10px #05010f, 0 0 0 11px rgba(255,255,255,.12), 0 40px 100px -20px rgba(106,60,240,.55)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(120% 45% at 20% 0%, rgba(106,60,240,.45), transparent 60%), radial-gradient(60% 30% at 90% 10%, rgba(210,67,230,.22), transparent 70%)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 50,
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px 0 34px',
      font: '600 15px var(--font-body)',
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("span", null, "21:04"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(PIcon, {
    name: "signal",
    size: 16
  }), /*#__PURE__*/React.createElement(PIcon, {
    name: "wifi",
    size: 16
  }), /*#__PURE__*/React.createElement(PIcon, {
    name: "battery-full",
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }
  }, children));
}
function TopBar({
  title,
  onBack,
  right
}) {
  const {
    IconButton
  } = window.LeGrandPronoDesignSystem_2fc6cd;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 16px',
      flex: 'none'
    }
  }, onBack && /*#__PURE__*/React.createElement(IconButton, {
    icon: "chevron-left",
    label: "Retour",
    onClick: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      font: 'var(--text-h2)',
      fontSize: 22
    }
  }, title), right);
}
function Section({
  title,
  action,
  onAction,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: 'var(--text-h2)',
      fontSize: 20
    }
  }, title), action && /*#__PURE__*/React.createElement("a", {
    onClick: onAction,
    style: {
      font: 'var(--text-body-s)',
      fontWeight: 700,
      color: 'var(--magenta-400)',
      cursor: 'pointer'
    }
  }, action)), children);
}
Object.assign(window, {
  Phone,
  TopBar,
  Section
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Phone.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/PickScreen.jsx
try { (() => {
function PickScreen({
  prono,
  initial,
  onBack,
  onSubmit
}) {
  const {
    CandidateCard,
    Badge,
    PointsChip,
    Card,
    Switch,
    Button,
    Dialog,
    Icon
  } = window.LeGrandPronoDesignSystem_2fc6cd;
  const [sel, setSel] = React.useState(initial || []);
  const [joker, setJoker] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const pool = prono.nominees ? CANDIDATES.filter(c => prono.nominees.includes(c.name)) : CANDIDATES;
  const toggle = n => setSel(s => s.includes(n) ? s.filter(x => x !== n) : prono.max === 1 ? [n] : s.length < prono.max ? [...s, n] : s);
  const ready = sel.length === prono.max;
  const pts = prono.points * (joker ? 2 : 1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    onBack: onBack,
    title: "",
    right: /*#__PURE__*/React.createElement(Badge, {
      tone: prono.locks ? 'magenta' : 'open'
    }, prono.locks ? 'Grand prono' : 'Ouvert')
  }), /*#__PURE__*/React.createElement("div", {
    className: "scroll",
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '4px 20px 170px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-overline"
  }, prono.locks || 'Prime 6 · ' + prono.deadline), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--text-h1)'
    }
  }, prono.question || prono.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: 'var(--text-secondary)',
      font: 'var(--text-body-s)'
    }
  }, /*#__PURE__*/React.createElement(PointsChip, {
    value: pts,
    tone: "gold",
    icon: "star"
  }), prono.max > 1 ? 'Choisis ' + prono.max + ' candidats' : 'Un seul choix')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 10
    }
  }, pool.map(c => /*#__PURE__*/React.createElement(CandidateCard, {
    key: c.id,
    name: c.name,
    meta: c.out ? 'Éliminé·e' : sel.includes(c.name) ? 'Mon choix' : prono.nominees && prono.max === 1 ? 'Nominé·e' : 'En lice',
    eliminated: c.out,
    selected: sel.includes(c.name),
    onSelect: () => toggle(c.name),
    size: pool.length > 6 ? 56 : 72
  }))), !prono.locks && /*#__PURE__*/React.createElement(Card, {
    padding: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "zap",
    size: 22,
    color: "var(--gold-400)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700
    }
  }, "Joker x2"), /*#__PURE__*/React.createElement("div", {
    className: "gp-caption"
  }, "1 joker restant cette saison")), /*#__PURE__*/React.createElement(Switch, {
    checked: joker,
    onChange: setJoker
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: '28px 20px 30px',
      background: 'var(--grad-protect)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, prono.max > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      font: 'var(--text-body-s)',
      color: 'var(--text-secondary)'
    }
  }, sel.length, "/", prono.max, " s\xE9lectionn\xE9s"), /*#__PURE__*/React.createElement(Button, {
    block: true,
    size: "lg",
    disabled: !ready,
    onClick: () => setConfirm(true)
  }, "Valider mon prono")), confirm && /*#__PURE__*/React.createElement(Dialog, {
    title: "Valider ton prono ?",
    onClose: () => setConfirm(false),
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      block: true,
      onClick: () => onSubmit(sel, pts)
    }, "Je valide"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      block: true,
      onClick: () => setConfirm(false)
    }, "Modifier"))
  }, "Tu mises sur ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--text-primary)'
    }
  }, sel.join(', ')), " pour ", pts, " pts. Tu peux changer d\u2019avis jusqu\u2019\xE0 la fermeture."));
}
window.PickScreen = PickScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/PickScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/ProfileScreen.jsx
try { (() => {
function ProfileScreen() {
  const {
    Avatar,
    Card,
    StatTile,
    Switch,
    Checkbox,
    Button,
    Badge,
    Input,
    Icon
  } = window.LeGrandPronoDesignSystem_2fc6cd;
  const [notif, setNotif] = React.useState(true);
  const [rappel, setRappel] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "Profil"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px 110px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Sam K",
    size: 72,
    ring: "magenta"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h2)'
    }
  }, "Sam K."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "gold",
    icon: "medal"
  }, "Voyant\xB7e"), /*#__PURE__*/React.createElement(Badge, null, "3 ligues")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: "371",
    label: "Points cette saison",
    accent: "var(--gold-400)"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "12/18",
    label: "Bons pronos"
  })), /*#__PURE__*/React.createElement(Card, {
    padding: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Rejoindre une ligue",
    icon: "key-round",
    placeholder: "Code, ex. STAR-8K2"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    block: true,
    icon: "users"
  }, "Inviter des amis"))), /*#__PURE__*/React.createElement(Card, {
    padding: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Notifications de prime"), /*#__PURE__*/React.createElement(Switch, {
    checked: notif,
    onChange: setNotif
  })), /*#__PURE__*/React.createElement(Checkbox, {
    checked: rappel,
    onChange: setRappel,
    label: "Rappel 1h avant la fermeture"
  })))));
}
window.ProfileScreen = ProfileScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/ProfileScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/PronosScreen.jsx
try { (() => {
function PronosScreen({
  played,
  openProno
}) {
  const {
    Tabs,
    PronoCard
  } = window.LeGrandPronoDesignSystem_2fc6cd;
  const [tab, setTab] = React.useState('todo');
  const todo = WEEKLY.filter(w => !played[w.id]),
    done = WEEKLY.filter(w => played[w.id]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "Pronos \xB7 Prime 6"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'todo',
      label: 'À jouer',
      count: todo.length
    }, {
      value: 'done',
      label: 'Joués',
      count: done.length
    }, {
      value: 'res',
      label: 'Résultats'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: '18px 20px 110px'
    }
  }, tab === 'todo' && todo.map(w => /*#__PURE__*/React.createElement(PronoCard, {
    key: w.id,
    question: w.question,
    points: w.points,
    deadline: w.deadline,
    onClick: () => openProno(w)
  })), tab === 'todo' && !todo.length && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 0',
      color: 'var(--text-secondary)'
    }
  }, "Tout est jou\xE9 pour ce prime. Rendez-vous samedi !"), tab === 'done' && done.map(w => /*#__PURE__*/React.createElement(PronoCard, {
    key: w.id,
    status: "done",
    question: w.question,
    points: w.points,
    pick: played[w.id].join(', '),
    onClick: () => openProno(w)
  })), tab === 'done' && !done.length && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 0',
      color: 'var(--text-secondary)'
    }
  }, "Aucun prono jou\xE9 pour l\u2019instant."), tab === 'res' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PronoCard, {
    status: "won",
    question: "Prime 5 \xB7 Qui sera sauv\xE9 ?",
    pick: "Jade",
    points: 30
  }), /*#__PURE__*/React.createElement(PronoCard, {
    status: "closed",
    question: "Prime 5 \xB7 Qui sera nomin\xE9 ?",
    pick: "Th\xE9o, Malo"
  }), /*#__PURE__*/React.createElement(PronoCard, {
    status: "won",
    question: "Prime 5 \xB7 D\xE9fi bonus : la chanson du duo",
    pick: "\xAB Ensemble \xBB",
    points: 50
  }))));
}
window.PronosScreen = PronosScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/PronosScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/RankScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function RankScreen() {
  const {
    SegmentedControl,
    Avatar,
    Card,
    LeaderboardRow,
    StatTile
  } = window.LeGrandPronoDesignSystem_2fc6cd;
  const [scope, setScope] = React.useState('ligue');
  const list = scope === 'ligue' ? PLAYERS : PLAYERS.map((p, i) => ({
    ...p,
    rank: [1, 2, 1284, 3, 4, 5][i] || p.rank,
    name: ['StarFan_75', 'Mélo', 'Sam', 'Julie.B', 'Kev', 'Aya'][i],
    points: [688, 671, 371, 660, 652, 640][i],
    sub: null
  })).sort((a, b) => a.rank - b.rank);
  const top = list.slice(0, 3);
  const order = [top[1], top[0], top[2]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "Classement"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px 110px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    block: true,
    value: scope,
    onChange: setScope,
    options: [{
      value: 'ligue',
      label: 'Les Stars du Canap’'
    }, {
      value: 'all',
      label: 'Général'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1.15fr 1fr',
      alignItems: 'end',
      gap: 8,
      paddingTop: 10
    }
  }, order.map((p, i) => {
    const first = i === 1;
    return /*#__PURE__*/React.createElement("div", {
      key: p.name,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: p.name,
      size: first ? 72 : 56,
      ring: first ? 'gold' : p.me ? 'magenta' : undefined
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 700,
        fontSize: 14
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: first ? 96 : 70,
        borderRadius: '14px 14px 4px 4px',
        background: first ? 'linear-gradient(180deg,rgba(255,203,92,.35),rgba(255,203,92,.05))' : 'linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.02))',
        boxShadow: first ? 'inset 0 1px 0 rgba(255,203,92,.7)' : 'inset 0 1px 0 rgba(255,255,255,.2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'italic 900 28px/1 var(--font-numeric)'
      },
      className: first ? 'gp-gold-text' : ''
    }, p.rank), /*#__PURE__*/React.createElement("div", {
      className: "gp-caption"
    }, p.points, " pts")));
  })), /*#__PURE__*/React.createElement(Card, {
    padding: 6
  }, list.slice(3).map(p => /*#__PURE__*/React.createElement(LeaderboardRow, _extends({
    key: p.name
  }, p))), scope === 'all' && /*#__PURE__*/React.createElement(LeaderboardRow, {
    rank: 1284,
    name: "Sam",
    points: 371,
    move: 212,
    me: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: "68%",
    label: "R\xE9ussite",
    trend: "+4 pts"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "5",
    label: "S\xE9rie en cours",
    accent: "var(--flare-400)"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "+41",
    label: "Ce prime",
    accent: "var(--green-500)"
  }))));
}
window.RankScreen = RankScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/RankScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/SeasonScreen.jsx
try { (() => {
function SeasonScreen({
  season,
  openProno
}) {
  const {
    Card,
    ProgressBar,
    PointsChip,
    Avatar,
    Badge,
    Icon
  } = window.LeGrandPronoDesignSystem_2fc6cd;
  const doneCount = SEASON.filter(s => s.done || season[s.id]).length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "Grands pronos"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: '0 20px 110px'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "stage",
    padding: 18
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-overline",
    style: {
      color: 'var(--gold-200)'
    }
  }, "Saison 2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h2)'
    }
  }, "Jusqu\u2019\xE0 430 pts en jeu d\u2019ici la finale"), /*#__PURE__*/React.createElement(ProgressBar, {
    label: "Grands pronos jou\xE9s",
    value: doneCount,
    max: SEASON.length
  }))), SEASON.map(s => {
    const pick = s.done ? [s.done] : season[s.id];
    return /*#__PURE__*/React.createElement(Card, {
      key: s.id,
      padding: 16,
      interactive: !s.done,
      onClick: () => !s.done && openProno(s)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, s.won ? /*#__PURE__*/React.createElement(Badge, {
      tone: "gold",
      icon: "trophy"
    }, "Gagn\xE9") : pick ? /*#__PURE__*/React.createElement(Badge, {
      tone: "magenta"
    }, "Jou\xE9") : /*#__PURE__*/React.createElement(Badge, {
      tone: "open"
    }, "\xC0 jouer"), /*#__PURE__*/React.createElement(PointsChip, {
      value: s.won ? s.points : String(s.points),
      tone: s.won ? 'gain' : 'gold',
      icon: "star"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'var(--text-h3)'
      }
    }, s.title), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, pick ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex'
      }
    }, pick.map((n, i) => /*#__PURE__*/React.createElement(Avatar, {
      key: n,
      name: n,
      size: 30,
      style: {
        marginLeft: i ? -8 : 0,
        boxShadow: '0 0 0 2px var(--surface-page)'
      }
    }))) : /*#__PURE__*/React.createElement("span", {
      className: "gp-caption",
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "lock-open",
      size: 13
    }), s.max, " choix"), /*#__PURE__*/React.createElement("span", {
      className: "gp-caption"
    }, s.locks))));
  })));
}
window.SeasonScreen = SeasonScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/SeasonScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/data.jsx
try { (() => {
const CANDIDATES = ['Inès', 'Noah', 'Jade', 'Malo', 'Léna', 'Théo', 'Chloé', 'Enzo', 'Lou', 'Yanis', 'Maëlle', 'Sacha'].map((n, i) => ({
  id: n,
  name: n,
  out: i === 5 || i === 11
}));
const PLAYERS = [{
  rank: 1,
  name: 'Camille',
  points: 412,
  move: 2,
  sub: '14 bons pronos'
}, {
  rank: 2,
  name: 'Hugo',
  points: 398,
  move: 0,
  sub: '13 bons pronos'
}, {
  rank: 3,
  name: 'Sam',
  points: 371,
  move: 1,
  me: true,
  sub: '12 bons pronos'
}, {
  rank: 4,
  name: 'Manon',
  points: 356,
  move: -2,
  sub: '11 bons pronos'
}, {
  rank: 5,
  name: 'Rayan',
  points: 340,
  move: -1,
  sub: '11 bons pronos'
}, {
  rank: 6,
  name: 'Léo',
  points: 318,
  move: 0,
  sub: '10 bons pronos'
}];
const WEEKLY = [{
  id: 'sauve',
  question: 'Qui sera sauvé par le public ?',
  points: 30,
  deadline: 'Ferme sam. 21h',
  nominees: ['Inès', 'Noah', 'Jade'],
  max: 1
}, {
  id: 'nomine',
  question: 'Qui sera nominé à l’issue du prime ?',
  points: 20,
  deadline: 'Ferme sam. 21h',
  nominees: ['Malo', 'Léna', 'Chloé', 'Enzo', 'Lou', 'Yanis', 'Maëlle'],
  max: 2
}, {
  id: 'eval',
  question: 'Qui aura la meilleure note aux évaluations ?',
  points: 15,
  deadline: 'Ferme ven. 18h',
  nominees: ['Inès', 'Noah', 'Jade', 'Malo', 'Léna', 'Chloé', 'Enzo', 'Lou', 'Yanis', 'Maëlle'],
  max: 1
}];
const SEASON = [{
  id: 'gagnant',
  title: 'Gagnant·e de la saison',
  points: 150,
  max: 1,
  locks: 'Verrouillé après le prime 8'
}, {
  id: 'finalistes',
  title: 'Les 4 demi-finalistes',
  points: 80,
  max: 4,
  locks: 'Verrouillé après le prime 8'
}, {
  id: 'tournee',
  title: 'Les 8 de la tournée',
  points: 100,
  max: 8,
  locks: 'Verrouillé après le prime 6'
}, {
  id: 'couple',
  title: 'Le couple de la saison',
  points: 60,
  max: 2,
  locks: 'Verrouillé après le prime 10'
}, {
  id: 'premier',
  title: 'Premier·e éliminé·e',
  points: 40,
  max: 1,
  locks: 'Terminé',
  done: 'Théo',
  won: true
}];
Object.assign(window, {
  CANDIDATES,
  PLAYERS,
  WEEKLY,
  SEASON
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/data.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/Dashboard.jsx
try { (() => {
function Dashboard() {
  const {
    Card,
    Countdown,
    Button,
    PronoCard,
    LeaderboardRow,
    StatTile,
    SegmentedControl,
    Tabs,
    Badge,
    ProgressBar,
    Toast
  } = window.LeGrandPronoDesignSystem_2fc6cd;
  const [tab, setTab] = React.useState('todo');
  const [scope, setScope] = React.useState('ligue');
  const [toast, setToast] = React.useState(false);
  const players = [['Camille', 412, 2], ['Hugo', 398, 0], ['Sam', 371, 1, true], ['Manon', 356, -2], ['Rayan', 340, -1], ['Léo', 318, 0], ['Aya', 301, 1]];
  const pronos = [['Qui sera sauvé par le public ?', 30, 'Ferme sam. 21h'], ['Qui sera nominé à l’issue du prime ?', 20, 'Ferme sam. 21h'], ['Qui aura la meilleure note aux évaluations ?', 15, 'Ferme ven. 18h'], ['Défi bonus : devine la chanson du trio', 50, 'Ferme sam. 21h']];
  return /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '32px 40px 80px',
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1.6fr) minmax(320px,1fr)',
      gap: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "stage",
    padding: 0
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'url(../../assets/key-art.jpg) 70% 40%/cover',
      opacity: .5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(90deg,rgba(23,6,67,.95) 30%,rgba(23,6,67,.2))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "gold"
  }, "Prime 6"), /*#__PURE__*/React.createElement(Badge, null, "Samedi 21h10")), /*#__PURE__*/React.createElement("h1", {
    className: "gp-display-l",
    style: {
      margin: 0
    }
  }, "Les pronos ferment dans"), /*#__PURE__*/React.createElement(Countdown, {
    seconds: 2 * 86400 + 3 * 3600 + 1500
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    iconRight: "arrow-right",
    onClick: () => {
      setToast(true);
      setTimeout(() => setToast(false), 2600);
    }
  }, "Jouer mes 4 pronos")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'todo',
      label: 'À jouer',
      count: 4
    }, {
      value: 'done',
      label: 'Joués',
      count: 0
    }, {
      value: 'res',
      label: 'Résultats prime 5'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, tab === 'todo' && pronos.map(([q, p, d]) => /*#__PURE__*/React.createElement(PronoCard, {
    key: q,
    question: q,
    points: p,
    deadline: d
  })), tab === 'done' && /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1/-1',
      padding: '40px 0',
      textAlign: 'center',
      color: 'var(--text-secondary)'
    }
  }, "Aucun prono jou\xE9 pour ce prime."), tab === 'res' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PronoCard, {
    status: "won",
    question: "Qui sera sauv\xE9 ?",
    pick: "Jade",
    points: 30
  }), /*#__PURE__*/React.createElement(PronoCard, {
    status: "closed",
    question: "Qui sera nomin\xE9 ?",
    pick: "Th\xE9o, Malo"
  }), /*#__PURE__*/React.createElement(PronoCard, {
    status: "won",
    question: "D\xE9fi bonus : la chanson du duo",
    pick: "\xAB Ensemble \xBB",
    points: 50
  }))))), /*#__PURE__*/React.createElement("aside", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'sticky',
      top: 96
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 20
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: 'var(--text-h2)'
    }
  }, "Classement"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    icon: "user-plus"
  }, "Inviter")), /*#__PURE__*/React.createElement(SegmentedControl, {
    block: true,
    value: scope,
    onChange: setScope,
    options: [{
      value: 'ligue',
      label: 'Les Stars du Canap’'
    }, {
      value: 'all',
      label: 'Général'
    }]
  }), /*#__PURE__*/React.createElement("div", null, players.map(([n, p, m, me], i) => /*#__PURE__*/React.createElement(LeaderboardRow, {
    key: n,
    rank: i + 1,
    name: n,
    points: p,
    move: m,
    me: me
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: "68%",
    label: "R\xE9ussite",
    trend: "+4 pts vs prime 5"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "5",
    label: "S\xE9rie en cours",
    accent: "var(--flare-400)"
  })), /*#__PURE__*/React.createElement(Card, {
    padding: 20
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    label: "Grands pronos jou\xE9s",
    value: 2,
    max: 5
  }))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "info",
    title: "Ouvre l\u2019app pour jouer",
    message: "Les pronos se jouent aussi depuis le site \u2014 bient\xF4t."
  })));
}
window.Dashboard = Dashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/Landing.jsx
try { (() => {
function Landing({
  go
}) {
  const {
    Button,
    Card,
    Icon,
    PointsChip,
    Input,
    Badge
  } = window.LeGrandPronoDesignSystem_2fc6cd;
  const steps = [['users', 'Crée ta ligue', 'Invite tes amis avec un code. Ligue privée, classement rien qu’à vous.'], ['star', 'Fais tes pronos', 'Chaque semaine : nominés, sauvés, évaluations, défis bonus. Tu as jusqu’au début du prime.'], ['trophy', 'Grimpe au classement', 'Les points tombent en direct pendant le prime. Rendez-vous à la finale.']];
  const big = [['crown', 'Le gagnant', 150], ['medal', 'Les 4 demi-finalistes', 80], ['ticket', 'Les 8 de la tournée', 100], ['heart', 'Le couple de la saison', 60], ['flame', 'Le premier éliminé', 40]];
  const wrap = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 40px'
  };
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      minHeight: 640,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'url(../../assets/key-art.jpg) 70% center/cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(90deg,#0d0322 0%,rgba(13,3,34,.92) 30%,rgba(13,3,34,.55) 55%,rgba(13,3,34,0) 80%),linear-gradient(0deg,#0d0322 0%,rgba(13,3,34,0) 30%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "live"
  }, "Prime 6 samedi"), /*#__PURE__*/React.createElement(Badge, null, "Saison 2026")), /*#__PURE__*/React.createElement("h1", {
    className: "gp-display-xl",
    style: {
      margin: 0,
      fontSize: 68
    }
  }, "Une saison.", /*#__PURE__*/React.createElement("br", null), "Des pronos.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "gp-glitter-text"
  }, "Un seul gagnant.")), /*#__PURE__*/React.createElement("p", {
    className: "gp-body-l",
    style: {
      margin: 0,
      color: 'var(--text-secondary)',
      maxWidth: 480
    }
  }, "Pr\xE9dis le gagnant, les finalistes, les nomin\xE9s de chaque semaine \u2014 et prouve que tu connais mieux la Star Academy que tes amis."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    iconRight: "arrow-right",
    onClick: () => go('dash')
  }, "Cr\xE9er ma ligue"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary",
    icon: "key-round",
    onClick: () => window.scrollTo({
      top: document.getElementById('join').offsetTop - 80,
      behavior: 'smooth'
    })
  }, "J\u2019ai un code"))))), /*#__PURE__*/React.createElement("section", {
    id: "how",
    style: {
      ...wrap,
      padding: '96px 40px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-overline",
    style: {
      color: 'var(--gold-400)'
    }
  }, "Comment \xE7a marche"), /*#__PURE__*/React.createElement("h2", {
    className: "gp-display-l",
    style: {
      margin: '10px 0 40px'
    }
  }, "Trois \xE9tapes, z\xE9ro prise de t\xEAte"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
      gap: 20
    }
  }, steps.map(([ic, t, d], i) => /*#__PURE__*/React.createElement(Card, {
    key: t,
    padding: 28
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-gold-text",
    style: {
      font: 'italic 900 48px/1 var(--font-numeric)'
    }
  }, "0", i + 1), /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 28,
    color: "var(--flare-400)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h2)'
    }
  }, t), /*#__PURE__*/React.createElement("p", {
    className: "gp-body",
    style: {
      margin: 0,
      color: 'var(--text-secondary)'
    }
  }, d)))))), /*#__PURE__*/React.createElement("section", {
    id: "season",
    style: {
      ...wrap,
      padding: '56px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-overline",
    style: {
      color: 'var(--gold-400)'
    }
  }, "D\xE8s le premier prime"), /*#__PURE__*/React.createElement("h2", {
    className: "gp-display-l",
    style: {
      margin: '10px 0 40px'
    }
  }, "Les grands pronos de la saison"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
      gap: 14
    }
  }, big.map(([ic, t, p]) => /*#__PURE__*/React.createElement(Card, {
    key: t,
    variant: "solid",
    padding: 20,
    interactive: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 28,
    color: "var(--magenta-400)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h3)'
    }
  }, t), /*#__PURE__*/React.createElement(PointsChip, {
    value: String(p),
    tone: "gold",
    icon: "star"
  }))))))), /*#__PURE__*/React.createElement("section", {
    id: "join",
    style: {
      ...wrap,
      padding: '40px 40px 96px'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "stage",
    padding: 48
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)',
      gap: 40,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "gp-display-l",
    style: {
      margin: 0
    }
  }, "Tes amis t\u2019attendent d\xE9j\xE0."), /*#__PURE__*/React.createElement("p", {
    className: "gp-body-l",
    style: {
      color: 'var(--text-secondary)',
      margin: '12px 0 0'
    }
  }, "Entre le code de leur ligue et rejoins la comp\xE9tition avant samedi.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Code de la ligue",
    icon: "key-round",
    placeholder: "Ex. STAR-8K2"
  }), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "glitter",
    block: true,
    onClick: () => go('dash')
  }, "Rejoindre la ligue"))))), /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      padding: '32px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 20,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    className: "gp-caption"
  }, "Jeu entre amis, sans argent. Application non officielle."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("a", null, "R\xE8gles du jeu"), /*#__PURE__*/React.createElement("a", null, "Confidentialit\xE9"), /*#__PURE__*/React.createElement("a", null, "Contact")))));
}
window.Landing = Landing;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/Landing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/SiteNav.jsx
try { (() => {
function Wordmark({
  size = 26
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-overline",
    style: {
      fontSize: 9,
      color: 'var(--gold-200)'
    }
  }, "Star Academy"), /*#__PURE__*/React.createElement("span", {
    className: "gp-glitter-text",
    style: {
      font: 'italic 900 ' + size + 'px/1 var(--font-display)',
      letterSpacing: '-.02em',
      whiteSpace: 'nowrap'
    }
  }, "Le Grand Prono"));
}
function SiteNav({
  page,
  go,
  authed
}) {
  const {
    Button,
    IconButton,
    Avatar,
    PointsChip
  } = window.LeGrandPronoDesignSystem_2fc6cd;
  const links = authed ? [['dash', 'Ma ligue'], ['dash-p', 'Pronos'], ['dash-s', 'Saison'], ['dash-r', 'Classement']] : [['how', 'Comment ça marche'], ['season', 'Grands pronos'], ['leagues', 'Ligues'], ['faq', 'FAQ']];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: 'rgba(13,3,34,.72)',
      backdropFilter: 'blur(18px)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      height: 72,
      padding: '0 40px',
      display: 'flex',
      alignItems: 'center',
      gap: 40,
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: () => go('landing'),
    style: {
      cursor: 'pointer',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, null)), /*#__PURE__*/React.createElement("nav", {
    className: "site-links",
    style: {
      display: 'flex',
      gap: 28,
      flex: 1,
      whiteSpace: 'nowrap'
    }
  }, links.map(([k, l], i) => /*#__PURE__*/React.createElement("a", {
    key: k,
    style: {
      font: 'var(--text-body)',
      fontWeight: 600,
      color: authed && i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
      cursor: 'pointer',
      textDecoration: 'none'
    }
  }, l))), authed ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(PointsChip, {
    value: "371",
    tone: "gold",
    icon: "star"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    dot: true,
    label: "Notifications"
  }), /*#__PURE__*/React.createElement(Avatar, {
    name: "Sam K",
    size: 40,
    ring: "magenta"
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: () => go('dash')
  }, "Se connecter"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => go('dash')
  }, "Cr\xE9er ma ligue"))));
}
Object.assign(window, {
  SiteNav,
  Wordmark
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/SiteNav.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.CandidateCard = __ds_scope.CandidateCard;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Countdown = __ds_scope.Countdown;

__ds_ns.LeaderboardRow = __ds_scope.LeaderboardRow;

__ds_ns.PointsChip = __ds_scope.PointsChip;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.PronoCard = __ds_scope.PronoCard;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
