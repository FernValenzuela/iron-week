// Custom plan helpers. IDs use 'c_' prefix so they never collide with hardcoded plan IDs.

export const CUSTOM_PLAN_TAGS = ["PUSH","PULL","LEGS","UPPER","ARMS"];

export const makeCustomPlanId = () => "c_" + Date.now();

export const makeCustomExerciseId = () => "ex_" + Date.now() + "_" + Math.floor(Math.random()*10000);
