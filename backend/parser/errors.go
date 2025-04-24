package parser

import "fmt"

var ErrInvalidFormat = &ParserWrappedError{
	code:  1001,
	msg:   "Invalid format",
	inner: nil,
}

type ParserWrappedError struct {
	code  int    // 错误的代码
	msg   string // 错误的消息
	inner error  // 被包装的原始错误
}

func (e *ParserWrappedError) Error() string {
	return fmt.Sprintf("Parser Error: [%d] %s", e.code, e.msg)
}

func (e *ParserWrappedError) Unwrap() error {
	return e.inner
}
