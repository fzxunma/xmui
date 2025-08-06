// XmLisp.test.js
import { test, expect } from "bun:test";
import { XmLisp } from "./XmLisp.js";

test("basic arithmetic", () => {
  expect(XmLisp.run("(+ 1 2)")).toBe(3);
  expect(XmLisp.run("(* 3 4)")).toBe(12);
  expect(XmLisp.run("(- 10 7)")).toBe(3);
  expect(XmLisp.run("(/ 10 2)")).toBe(5);
});

test("conditional if", () => {
  expect(XmLisp.run("(if (> 3 2) 1 0)")).toBe(1);
  expect(XmLisp.run("(if (< 3 2) 1 0)")).toBe(0);
});

test("define variable", () => {
  XmLisp.run("(define x 42)");
  expect(XmLisp.run("x")).toBe(42);
});

test("lambda function", () => {
  XmLisp.run("(define add (lambda (a b) (+ a b)))");
  expect(XmLisp.run("(add 5 7)")).toBe(12);
});

test("list operations", () => {
  expect(XmLisp.run("(car (list 1 2 3))")).toBe(1);
  expect(XmLisp.run("(cdr (list 1 2 3))")).toEqual([2, 3]);
  expect(XmLisp.run("(cons 0 (list 1 2))")).toEqual([0, 1, 2]);
});
test("begin should evaluate multiple expressions in order", () => {
  const result = XmLisp.run(`(begin 
    (define x 1)
    (define y 2)
    (+ x y)
  )`);
  expect(result).toBe(3);
});

test("while loop with counter", () => {
  const env = XmLisp.createGlobalEnv();
  XmLisp.eval(XmLisp.parse(XmLisp.tokenize(`(define count 0)`)), env);
  XmLisp.eval(
    XmLisp.parse(
      XmLisp.tokenize(`
    (while (< count 5) 
      (begin 
        (define count (+ count 1))
      )
    )
  `)
    ),
    env
  );
  expect(XmLisp.eval("count", env)).toBe(5);
});

test("independent environments (module or REPL)", () => {
  const env1 = XmLisp.createGlobalEnv();
  XmLisp.eval(XmLisp.parse(XmLisp.tokenize(`(define x 10)`)), env1);
  expect(XmLisp.eval("x", env1)).toBe(10);

  const env2 = XmLisp.createGlobalEnv();
  expect(() => XmLisp.eval("x", env2)).toThrow("Undefined symbol: x");
});
test("XmLisp 数学运算", () => {
  expect(XmLisp.run("(+ 1 2)")).toBe(3);
  expect(XmLisp.run("(* 2 5)")).toBe(10);
});

test("XmLisp 变量定义", () => {
  const env = XmLisp.createGlobalEnv();
  XmLisp.run("(define x 8)", env);
  expect(XmLisp.run("(+ x 2)", env)).toBe(10);
});

test("XmLisp 条件语句 if", () => {
  expect(XmLisp.run("(if (> 5 2) 100 200)")).toBe(100);
});

test("XmLisp lambda 函数", () => {
  expect(XmLisp.run("((lambda (x) (+ x 1)) 5)")).toBe(6);
});

test("XmLisp while 循环", () => {
  const env = XmLisp.createGlobalEnv();
  XmLisp.run("(define x 0)", env);
  XmLisp.run(`(while (< x 5) (define x (+ x 1)))`, env);
  expect(env.x).toBe(5);
});

test("XmLisp begin 顺序执行", () => {
  expect(XmLisp.run(`(begin (define x 1) (define y 2) (+ x y))`)).toBe(3);
});
