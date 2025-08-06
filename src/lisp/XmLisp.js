export class XmLisp {
  static global = XmLisp.createGlobalEnv();

  static createGlobalEnv(parent = null) {
    const env = Object.create(parent || null);
    Object.assign(env, {
      // 原子操作
      "+": (a, b) => a + b,
      "-": (a, b) => a - b,
      "*": (a, b) => a * b,
      "/": (a, b) => a / b,
      "=": (a, b) => a === b,
      ">": (a, b) => a > b,
      "<": (a, b) => a < b,
      print: (...args) => console.log(...args),

      // 条件语句
      if: (cond, thenVal, elseVal) => (cond ? thenVal : elseVal),

      // 列表原语
      cons: (a, b) => [a].concat(b),
      car: (lst) => lst[0],
      cdr: (lst) => lst.slice(1),
      list: (...args) => args,
    });
    return env;
  }

  static tokenize(code) {
    return code.replace(/\(/g, " ( ").replace(/\)/g, " ) ").trim().split(/\s+/);
  }

  static parse(tokens) {
    if (tokens.length === 0) throw new SyntaxError("Unexpected EOF");

    const token = tokens.shift();
    if (token === "(") {
      const list = [];
      while (tokens[0] !== ")") list.push(this.parse(tokens));
      tokens.shift(); // remove ')'
      return list;
    } else if (token === ")") {
      throw new SyntaxError("Unexpected )");
    } else {
      return this.atom(token);
    }
  }

  static atom(token) {
    if (!isNaN(parseFloat(token))) return parseFloat(token);
    if (token.startsWith('"') && token.endsWith('"')) return token.slice(1, -1);
    return token;
  }

  static eval(ast, env = this.global) {
    if (typeof ast === "string") {
      if (!(ast in env)) throw new ReferenceError(`Undefined symbol: ${ast}`);
      return env[ast];
    }

    if (typeof ast === "number" || typeof ast === "boolean") {
      return ast;
    }

    if (!Array.isArray(ast)) return ast;

    const [first, ...rest] = ast;

    switch (first) {
      case "define": {
        const [name, expr] = rest;
        env[name] = this.eval(expr, env);
        return env[name];
      }

      case "lambda": {
        const [params, body] = rest;
        return (...args) => {
          const localEnv = Object.create(env);
          for (let i = 0; i < params.length; i++) {
            localEnv[params[i]] = args[i];
          }
          return this.eval(body, localEnv);
        };
      }

      case "if": {
        const [cond, thenVal, elseVal] = rest;
        return this.eval(cond, env)
          ? this.eval(thenVal, env)
          : this.eval(elseVal, env);
      }

      case "while": {
        const [cond, body] = rest;
        let result;
        while (this.eval(cond, env)) {
          result = this.eval(body, env);
        }
        return result;
      }

      case "begin": {
        let result;
        for (const expr of rest) {
          result = this.eval(expr, env);
        }
        return result;
      }
    }

    // 默认函数调用
    const fn = this.eval(first, env);
    const args = rest.map((arg) => this.eval(arg, env));
    return fn(...args);
  }

  static run(code, scope = null) {
    const tokens = this.tokenize(code);
    const ast = this.parse(tokens);
    const env = scope || this.global;
    return this.eval(ast, env);
  }

  // ────────────── JS AST 转 Lisp 树 ──────────────

  static fromJsAst(ast) {
    if (!ast || typeof ast !== "object") return ast;

    switch (ast.type) {
      case "BinaryExpression":
        return [
          ast.operator,
          this.fromJsAst(ast.left),
          this.fromJsAst(ast.right),
        ];

      case "CallExpression":
        const callee = this.fromJsAst(ast.callee);
        const args = ast.arguments.map((a) => this.fromJsAst(a));
        return [callee, ...args];

      case "Identifier":
        return ast.name;

      case "Literal":
        return ast.value;

      case "Program":
        return this.fromJsAst(ast.body[0]);

      case "ExpressionStatement":
        return this.fromJsAst(ast.expression);

      default:
        throw new Error(`Unsupported AST node: ${ast.type}`);
    }
  }
}
