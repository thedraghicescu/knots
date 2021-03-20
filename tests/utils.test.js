const {isValidKey,findObjectFromPath} =require('../src/utils.js')
describe("KEY Validation", () => {
	test("undefined SHOULD NOT be a valid key", () => {
		expect(isValidKey()).toBe(false);
	});
	test("null SHOULD NOT be a valid key", () => {
		expect(isValidKey(null)).toBe(false);
	});
	test("{} SHOULD NOT be a valid key", () => {
		expect(isValidKey({})).toBe(false);
	});
	test("[] SHOULD NOT be a valid key", () => {
		expect(isValidKey([])).toBe(false);
	});
	test("'' SHOULD NOT be a valid key", () => {
		expect(isValidKey("")).toBe(false);
	});
	test("' ' SHOULD NOT be a valid key", () => {
		expect(isValidKey(" ")).toBe(false);
	});
	test("0 SHOULD be a valid key", () => {
		expect(isValidKey(0)).toBe(true);
	});
		
	test("0.1 SHOULD NOT be a valid key", () => {
		expect(isValidKey(0.1)).toBe(false);
	});
	test("Negative numbers SHOULD NOT be a valid key", () => {
		expect(isValidKey(-1)).toBe(false);
		expect(isValidKey(-1.0)).toBe(false);
	});
    test("Floats SHOULD NOT be a valid key", () => {
		expect(isValidKey(1.3)).toBe(false);
	});
	test("Positive integers SHOULD be a valid key", () => {
		expect(isValidKey(1)).toBe(true);
	});
	test("key containing '.' SHOULD NOT be a valid key", () => {
		expect(isValidKey("a.v")).toBe(false);
	});
	test("'testKey' SHOULD be a valid key", () => {
		expect(isValidKey("testKey")).toBe(true);
	});
	

});

describe("findObjectFromPath ",()=>{
	test("should throw error if path is not an array",()=>{
		expect(()=> findObjectFromPath({},"") ).toThrow(/array/);
	})
	test("should throw error is mainObj is null",()=>{
		expect(()=>findObjectFromPath(null,[])).toThrow(/null/)
	})
	test("if part of a path is missing it should return null",()=>{
		let mainObj = {root:{lvl1:{lvl2:{}}}}
		expect (findObjectFromPath(mainObj,["root","lvlX"])).toBeNull();
		expect (findObjectFromPath(mainObj,["root","lvl1","lvl2","lvl3"])).toBeNull();
		expect (findObjectFromPath(mainObj,["X"])).toBeNull();
	})
	test("should return the correct path",()=>{
		let mainObj = {root:{lvl1:{lvl2:{}}}}
		expect (findObjectFromPath(mainObj,["root"])).toEqual({lvl1:{lvl2:{}}})
		expect (findObjectFromPath(mainObj,["root","lvl1"])).toEqual({lvl2:{}})
		expect (findObjectFromPath(mainObj,["root","lvl1","lvl2"])).toEqual({})

	})
	test("empty path should throw an error ",()=>{
		expect (()=>findObjectFromPath({},[])).toThrow(/element/)
	})
})