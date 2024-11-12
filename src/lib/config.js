export const config = {
  CF_ACCOUNT_ID: 'cd4628cb46169b384a110e86fa36a731',
  CF_ACCOUNT_HASH: 'ZBOPrnpcIfgpzV8AiUbS2Q',
  CF_PROMOTIONS_NAMESPACE_ID: '006dfa1605ba45ae832b0f125ff9ebec',
  CF_KV_NAMESPACE_ID: 'bd4ebd9aef1d46b7ba7ec4a523a6113e',
  CF_PAGES_NAMESPACE_ID: '68060535d7c441babc94e36841271619'
};

// Add the new collaborator config
export const COLLABORATOR_BRANDS = {
  'micke@igpholding.com': ['212', '188', '12'], // BetDukes, Casimboo, etc
  // Add more collaborators as needed
};

export const ACCESS_LEVELS = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER'
};

// Helper functions
export function hasAccess(email, brandId) {
  return COLLABORATOR_BRANDS[email]?.includes(brandId.toString());
}

export function getUserBrands(email) {
  return COLLABORATOR_BRANDS[email] || [];
}