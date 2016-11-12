const SomeComponent = styled.div`
    color: #ebebeb;
    font-size: ${props => props.theme.fontSize};
    font-family: Helvetica;
    ${mixin}
`

const mixin = css`
    height: 20px;
    padding: 5px;        
`

const arrowFun = (...args) => css`
    height: 12px;
`

const test = "broken" /* Highlighting is broken after a styled-component is returned from an arrow function*/

class Test extends Reat.Component {
    render () {
        return styled(Component)`
            line-height: 21px;
        `
    }
}

let abc

abc = css(cake)`
    height: 1px;
`
styled`
    height: 12px;
`

 (styled.div`
    height: 12px;
`)

export default styled(Thumbnail)`
	max-width: 100%;
`

function block() {
    return styled.div`
        height: 15px;
    `
}

const ObjectLiteral = {
    styles: styled`
        height: 12px;
        color: #000000;
        font: ${props => 'lol'};
        ${props => 'padding: 5px'}
        ${props => 'border'}: 1px solid #000000;
    `
}
