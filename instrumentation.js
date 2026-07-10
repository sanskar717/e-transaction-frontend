export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { Agent, setGlobalDispatcher } = await import('undici')
        setGlobalDispatcher(new Agent({ connect: { family: 4 } }))
    }
}