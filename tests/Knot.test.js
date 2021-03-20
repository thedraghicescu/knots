const Knot =require ('../src/Knot.js');





describe("knot CLASS",()=>{
	
    describe("Creating knots",()=>{
        
        test("with invalid keys should throw an error",()=>{
            expect( ()=>  new Knot()).toThrow();
			expect( ()=>  new Knot(null)).toThrow();
			expect( ()=>  new Knot({})).toThrow();
			
        })
        test("with valid knot should not throw an error",()=>{
           expect( ()=> { new Knot("a")} ).not.toThrow();
        })
    });

    describe("Add",()=>{
		let root;
		beforeEach(()=>{
			 root = new Knot("root");
		})
        it("should throw an error when no or invalid arguments are provided",()=>{
			expect(()=> root.tie({})).toThrow(/instance/)
            expect(()=> root.tie()).toThrow(/instance/)
        })
		it("should increase knots size",()=>{
			expect(root.knots.size).toBe(0);
			root.tie(new Knot("sizeTest"));
			expect(root.knots.size).toBe(1);
		})
		it("should add knot to map",()=>{
			root.tie(new Knot("unique"));
			expect(root.hasKnot('unique')).toBe(true);
		})
		it("should no throw when adding a knot with a unique key",()=>{
			root.tie(new Knot("unique"));
			expect(()=>root.tie(new Knot("unique2"))).not.toThrow();
		})
		it("should throw when adding a knot with the same key",()=>{
			root.tie(new Knot("unique"));
			expect(()=>root.tie(new Knot("unique"))).toThrow(/exists/);
		})
		it("sholud add to the correct instance",()=>{
			root.tie(new Knot("lvl1"))
			root["lvl1"].tie(new Knot("lvl2"))
			expect (root.hasKnot("lvl1")).toBe(true)
			expect (root["lvl1"].hasKnot("lvl2")).toBe(true)
			expect(root.toObject()).toEqual({
				root:{
					lvl1:{
						lvl2:{}
					}
				}
			})
		})
        
    });
	describe("Pop",()=>{
		let root
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("kid1"))
			root.tie(new Knot("kid2"))
			root.tie(new Knot("kid3"))
			root["kid1"].tie(new Knot("friend1"))
			root["kid1"].tie(new Knot("friend2"))
			root["kid2"].tie(new Knot("friend1"))
		})
        it("should throw an error when called on root",()=>{
			expect(()=> root.untie()).toThrow(/root/)
        })
		it("should decrease knots size",()=>{
			expect(root.knots.size).toBe(3);
			root["kid2"].unTie();
			expect(root.knots.size).toBe(2);
		})
		it("should remove the corect knot from map",()=>{
			root["kid3"].unTie();
			expect(root["kid3"]).toBeNull();
			expect(root["kid1"]).not.toBeNull();
			expect(root["kid2"]).not.toBeNull();
		})
		it("should remove the corect knot from nested map",()=>{
			root["kid2"]["friend1"].unTie();
			expect(root["kid2"]).not.toBeNull();
			expect(root["kid2"]["friend1"]).toBeNull();
			expect(root["kid1"]).not.toBeNull();
			expect(root["kid3"]).not.toBeNull();
		})
		
        
    });
	describe("Getting index of knot['key'] ",()=>{
		let root;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("kid1"))
			root.tie(new Knot("kid2"))
			root.tie(new Knot("kid3"))
			root["kid1"].tie(new Knot("friend1"))
			root["kid1"].tie(new Knot("friend2"))
			root["kid2"].tie(new Knot("friend1"))
			root["kid1"]["friend2"].tie(new Knot("friend2kid"))
			root.kid2.tie(new Knot(1));
			
		})
		
        it("should return null if the key is not found",()=>{
			expect(root["missingKey"]).toBeNull();
        })
		it("should return the correct knot even if popped another",()=>{
			root["kid1"].unTie();
			expect(root["kid2"]).not.toBeNull();
		})

		it("should return the correct knot when chaining multiple indexers ex: root[a][b]",()=>{
			expect(root["kid1"]).toHaveProperty('KEY','kid1')
			expect(root["kid1"]["friend2"]).toHaveProperty('KEY','friend2')
			expect(root["kid2"]["friend1"]).toHaveProperty('KEY','friend1')
		})
		it("should return the knot specified in the namespace ex: root['lvl1.lvl2'] => lvl2",()=>{
			expect(root['kid1.friend2']).toHaveProperty('KEY','friend2')
		});
		it("should return null when a part of the namespace is not found",()=>{
			expect(root['kid1.missing']).toBeNull()
			expect(root['kid1.friend2.missing']).toBeNull()
		});

		it("should get correct knot when starting from another level",()=>{
			expect(root["kid1"]['friend2.friend2kid']).toHaveProperty('KEY','friend2kid')
		})

		it("should work with number keys",()=>{
			expect(root["kid2"].hasKnot(1)).toBe(true)
			expect(root["kid2"][1]).not.toBeNull();
			expect(root["kid2"][1]).toHaveProperty("KEY",1)
			expect(root["kid2.1"]).toHaveProperty("KEY",1)
		})
		
		
        
    });

	

	describe("findRoot",()=>{
		let root;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("lvl1"))
			root.tie(new Knot("lvl2"))
			root["lvl1"].tie(new Knot("lvl1-1"))
		})
		it("should return self if called from root",()=>{
			expect(root.findRoot()).toHaveProperty("KEY","root")
		})
		it("should return the correct knot when called from child knots",()=>{
			expect(root["lvl2"].findRoot()).toHaveProperty("KEY","root")
			expect(root["lvl1"]["lvl1-1"].findRoot()).toHaveProperty("KEY","root")
			expect(root["lvl1.lvl1-1"].findRoot()).toHaveProperty("KEY","root")
		})
	})

	describe("getPath ",()=>{
		let root;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("lvl1"))
			root.tie(new Knot("lvl2"))
			root["lvl1"].tie(new Knot("lvl1-1"))
		})
		it("should return a string array ",()=>{
			expect(root.getPath()).toEqual(["root"])
		})
		it("should return correct path from indexer or namespace",()=>{
			expect(root["lvl1"].getPath()).toEqual(["root","lvl1"])
			expect(root["lvl1"]["lvl1-1"].getPath()).toEqual(["root","lvl1","lvl1-1"])
			expect(root["lvl1.lvl1-1"].getPath()).toEqual(["root","lvl1","lvl1-1"])
		})
		it("should return correct path when called from a child knot",()=>{
			let kid =root["lvl1"];
			expect(kid.getPath()).toEqual(["root","lvl1"])
			
		})
	})
	describe("getNamespace ",()=>{
		let root;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("lvl1"))
			root.tie(new Knot("lvl2"))
			root["lvl1"].tie(new Knot("lvl1-1"))
			root.lvl2.tie(new Knot(2));
			
		})

		it("should return the root's key when called from root" ,()=>{
			expect(root.getNamespace()).toBe("root")
		})
		it("should return the correct namespace when called from child knot",()=>{
			let kid = root["lvl1.lvl1-1"];
			expect(kid.getNamespace()).toBe('root.lvl1.lvl1-1')
		})
		it("should return the correct namespace even with integer keys",()=>{
			expect(root["lvl2.2"]).not.toBeNull()
			expect(root["lvl2.2"].getNamespace()).toBe("root.lvl2.2")
		})
	})

	describe("Drill",()=>{
		let root;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("lvl1"))
			root.tie(new Knot("lvl2"))
			
		})
		it("should return whatever the callback is doing when starting from root",()=>{
		let val ="";
			root.drill((knot)=>{
				val += ">"+ knot.KEY;
			})
			expect(val).toBe(">root>lvl1>lvl2")
		})
		it("should not include itself when starting from root and childrenOnly is true",()=>{
			let val ="";
			 root.drill((knot)=>{
				val += ">"+ knot.KEY;
			},true)

			expect(val).toBe(">lvl1>lvl2")
		})
		it("should also work when starting from a child knot",()=>{
			root["lvl1"].tie(new Knot("lvl1-1"))
			let val ="";
			 root["lvl1"].drill((knot)=>{
				val += ">"+ knot.KEY;
			})

			expect(val).toBe(">lvl1>lvl1-1")
		})
		
	})

	describe("toObject",()=>{
		let root;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("lvl1"))
			root.tie(new Knot("lvl2"))
			root["lvl1"].tie(new Knot("lvlA"))
		})
		it("should return full tree {root:{...}} when calling from root",()=>{
			expect(root.toObject()).toEqual({
				root:{
					lvl1:{
						lvlA:{}
					},
					lvl2:{}
				}
			})
		})
		it("should not include parent when starting from a child knot",()=>{
			expect(root["lvl1"].toObject()).toEqual({
				lvl1:{
					lvlA:{}
				}
			})
		})
		it("should exclude itself when childrenOnly is set to true",()=>{
			expect(root.toObject(true)).toEqual({
				lvl1:{
					lvlA:{}
				},
				lvl2:{}
			})
		})
		
		it("should exclude self when starting from child knot and has childrenOnly=true",()=>{
			root["lvl1"].tie(new Knot("lvlB"));
			expect(root["lvl1"].toObject(true)).toEqual({
				lvlA:{},
				lvlB:{}
			})
		})
		
		
	})

	describe("children",()=>{
		let root;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("lvl1"))
			root.tie(new Knot("lvl2"))
			root["lvl2"].tie(new Knot("lvlA"))
		})
		it("should return empty array when there are no children",()=>{
			expect(root["lvl1"].children).toEqual([]);
		})
		it("should return only its children and no other descendents",()=>{
			let kids=root.children.map(knot=>knot.KEY);
			expect(kids).toEqual(["lvl1","lvl2"]);
		})
	})


	describe("hasSiblings",()=>{
		let root;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("lvl1"))
			root.tie(new Knot("lvl2"))
			root["lvl2"].tie(new Knot("lvlA"))
		})
		it("should return false if called from root",()=>{
			expect(root.hasSiblings).toBe(false)
		})
		it("should return true when called from children and parent has more then 1 knots",()=>{
			expect(root["lvl1"].hasSiblings).toBe(true)
		})
		test("should return false if child knot does not have siblings",()=>{
			expect(root["lvl2.lvlA"].hasSiblings).toBe(false)
		})
		it("should return true if child knot does have siblings",()=>{
			root["lvl2"].tie(new Knot("lvlB"))
			expect(root["lvl2.lvlA"].hasSiblings).toBe(true)
		})

		


	})
	describe("siblings()",()=>{
		let root;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("lvl1"))
			root.tie(new Knot("lvl2"))
			root["lvl2"].tie(new Knot("lvlA"))
		})

		it("should return an empty array if there are no siblings",()=>{
			expect(root.siblings()).toEqual([])
		})

		it("should return the correct array",()=>{
			let result = root["lvl1"].siblings().map(knot=>knot.KEY);
			expect(result).toEqual(["lvl2"])
		})


	})

	describe("hasKnot",()=>{
		let root;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("lvl1"))
			root.tie(new Knot("lvl2"))
			root["lvl2"].tie(new Knot("lvlA"))
		})
			
		it("should return fals when no arguments provided",()=>{
			expect(root.hasKnot()).toBe(false)
		})
		it("should return false when the key does not exist",()=>{
			expect(root.hasKnot("wrongKey")).toBe(false)
		})
		it("should return true when the right key is passed",()=>{
			expect(root.hasKnot("lvl1")).toBe(true)
			expect(root["lvl2"].hasKnot("lvlA")).toBe(true)
		})
		
	})
	describe("Setting parent",()=>{
		it("should work when setting form root",()=>{
			var knot1 = new Knot(1)
			var knot2 = new Knot(2)
			knot2.parent = knot1;
			expect(knot2.parent).toHaveProperty("KEY",1)
		})
		it("should thorw error when the parent was allready set internaly when adding knot",()=>{
			let root = new Knot("root")
			let lvl1 = new Knot("lvl1")
			root.tie(lvl1)
			expect(()=>lvl1.parent=root).toThrow(/Avoid/);
		})
	})

	describe("Serialize to json",()=>{
		let root ;
		beforeEach(()=>{
			root = new Knot("root");
			root.tie(new Knot("lvl1"))
		});
		it("should not output all subsequent knots when fullTree is set to false(default)",()=>{
			expect(root.json(false)).toEqual("{\"knots\":{}}")
		});
		it("should not output all subsequent knots when fullTree is set to false(default)",()=>{
			const root = new Knot("root");
			root.tie(new Knot("lvl1"))
			expect(root.json(true)).toEqual("{\"knots\":[[\"lvl1\",{\"knots\":[]}]]}")
		})
		
	})
})