-- New profiles lead with Experience and use the Executive theme. Defaults only: existing rows keep their saved order and theme.
ALTER TABLE "Profile" ALTER COLUMN "theme" SET DEFAULT 'executive',
ALTER COLUMN "sectionConfig" SET DEFAULT '[{"key":"about","visible":true},{"key":"experience","visible":true},{"key":"projects","visible":true},{"key":"skills","visible":true},{"key":"education","visible":true},{"key":"writing","visible":false},{"key":"testimonials","visible":false},{"key":"contact","visible":false}]';
