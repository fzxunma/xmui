import { test, expect, beforeEach } from "bun:test";
import { XmLisp, LispError } from "./XmLisp.js";

beforeEach(() => {
  XmLisp.global = XmLisp.createGlobalEnv();
});

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

test("define and variable", () => {
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

test("begin executes expressions in order", () => {
  expect(XmLisp.run(`(begin (define x 1) (define y 2) (+ x y))`)).toBe(3);
});

test("while loop", () => {
  const env = XmLisp.createGlobalEnv();
  XmLisp.eval(XmLisp.parse(XmLisp.tokenize(`(define count 0)`)), env);
  XmLisp.eval(
    XmLisp.parse(
      XmLisp.tokenize(`(while (< count 5) (begin (define count (+ count 1))))`)
    ),
    env
  );
  expect(XmLisp.eval("count", env)).toBe(5);
});

test("cond expression", () => {
  expect(
    XmLisp.run(`(cond
      ((> 2 3) 100)
      ((< 2 3) 200)
      (true 300)
    )`)
  ).toBe(200);
});

test("let binding", () => {
  expect(XmLisp.run(`(let ((x 5) (y 10)) (+ x y))`)).toBe(15);
});

test("set! updates variables", () => {
  const env = XmLisp.createGlobalEnv();
  XmLisp.eval(XmLisp.parse(XmLisp.tokenize(`(define a 1)`)), env);
  XmLisp.eval(XmLisp.parse(XmLisp.tokenize(`(set! a 5)`)), env);
  expect(XmLisp.eval("a", env)).toBe(5);
});

test("set! error if undefined variable", () => {
  const env = XmLisp.createGlobalEnv();
  expect(() =>
    XmLisp.eval(XmLisp.parse(XmLisp.tokenize(`(set! b 5)`)), env)
  ).toThrow(LispError);
});

test("throws on undefined symbol", () => {
  expect(() => XmLisp.run("unknownVar")).toThrow(LispError);
});

test("fromJsAst converts correctly", () => {
  const jsAst = {
    type: "BinaryExpression",
    operator: "+",
    left: { type: "Literal", value: 1 },
    right: { type: "Literal", value: 2 },
  };
  expect(XmLisp.fromJsAst(jsAst)).toEqual(["+", 1, 2]);
});
