document.addEventListener('DOMContentLoaded', function() {
    // 设置当前域名
    const currentDomain = window.location.hostname;
    document.getElementById('current-domain').textContent = currentDomain;
    
    // 表单提交
    document.getElementById('sn-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            domain: document.getElementById('domain').value.trim(),
            server_ip: document.getElementById('server_ip').value.trim(),
            user: document.getElementById('user').value.trim(),
            existing_sn: document.getElementById('existing_sn').value.trim()
        };
        
        // 显示加载状态
        const resultContainer = document.getElementById('result-container');
        const snCodeElement = document.getElementById('sn-code');
        resultContainer.style.display = 'block';
        snCodeElement.innerHTML = '<div class="loading">正在生成SN码...</div>';
        
        // 调用后端API
        fetch('https://api.pboot.eu.cc/api/pboot_sn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('API返回数据:', data);
            
            if (data.success) {
                // 兼容不同的数据结构
                let snCodes = null;
                let verificationInfo = null;
                
                if (data.data && data.data.sn_codes) {
                    snCodes = data.data.sn_codes;
                    verificationInfo = data.data.verification_info;
                } else if (data.sn_codes) {
                    snCodes = data.sn_codes;
                    verificationInfo = data.verification_info;
                } else if (Array.isArray(data.data)) {
                    snCodes = data.data;
                } else {
                    throw new Error('无法解析API返回的数据结构');
                }
                
                // 验证数据
                if (!Array.isArray(snCodes) || snCodes.length === 0) {
                    throw new Error('SN码数组为空或格式错误');
                }
                
                // 显示生成的SN码
                let snCodeHtml = `'sn' => array(<br>`;
                snCodes.forEach(code => {
                    snCodeHtml += `&nbsp;&nbsp;&nbsp;&nbsp;'${code}',<br>`;
                });
                snCodeHtml += `),`;
                
                snCodeElement.innerHTML = snCodeHtml;
                
                // 显示验证因子信息
                let verificationHtml = '';
                if (verificationInfo) {
                    verificationHtml = '<strong>验证因子说明：</strong><ul>';
                    
                    if (verificationInfo.domain_variants && verificationInfo.domain_variants.length > 0) {
                        verificationHtml += '<li><strong>域名验证码：</strong><div class="domain-variants">';
                        verificationInfo.domain_variants.forEach(item => {
                            verificationHtml += `<div class="variant-item">
                                <span class="variant-key">${item.domain}</span>：
                                <strong>${item.code}</strong>
                            </div>`;
                        });
                        verificationHtml += '</div></li>';
                    }
                    
                    if (verificationInfo.ip_code) {
                        verificationHtml += `<li><strong>IP验证码</strong> (${verificationInfo.ip}): ${verificationInfo.ip_code}</li>`;
                    }
                    
                    if (verificationInfo.user_code) {
                        verificationHtml += `<li><strong>用户验证码</strong> (${verificationInfo.user}): ${verificationInfo.user_code}</li>`;
                    }
                    
                    verificationHtml += '</ul>';
                }
                
                document.getElementById('verification-info').innerHTML = verificationHtml;
                
                // 存储数据用于复制功能
                window.currentSnCodes = snCodes;
                window.verificationInfo = verificationInfo;
                
            } else {
                snCodeElement.innerHTML = `<div style="color: #e53e3e;">生成失败: ${data.message || '未知错误'}</div>`;
            }
        })
        .catch(error => {
            console.error('请求错误:', error);
            snCodeElement.innerHTML = `<div style="color: #e53e3e;">错误: ${error.message}</div>`;
        });
    });
});

function useCurrentDomain() {
    document.getElementById('domain').value = window.location.hostname;
}

function copyToClipboard() {
    if (!window.currentSnCodes) {
        alert('请先生成SN码');
        return;
    }
    
    const text = window.currentSnCodes.join(',');
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showCopySuccess();
            })
            .catch(err => {
                console.error('复制失败:', err);
                fallbackCopy(text);
            });
    } else {
        fallbackCopy(text);
    }
    
    function showCopySuccess() {
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.textContent;
        btn.textContent = '已复制！';
        btn.style.background = '#48bb78';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }
    
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (success) {
            showCopySuccess();
        } else {
            alert('复制失败，请手动复制');
        }
    }
}
