jQuery(document).ready(function($) {
    // Tab switching
    $('.nav-tab').on('click', function(e) {
        e.preventDefault();
        $('.nav-tab').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');
        
        $('.ifp-tab-content').removeClass('active');
        $($(this).attr('href')).addClass('active');
    });
    
    // Bulk action buttons
    $('.ifp-bulk-action').on('click', function() {
        const action = $(this).data('action');
        
        switch(action) {
            case 'optimize':
                $('#bulk-optimization').addClass('active');
                $('.nav-tab[href="#bulk-optimization"]').addClass('nav-tab-active').siblings().removeClass('nav-tab-active');
                break;
            case 'restore':
                if (confirm(ifp_vars.i18n.confirm_restore)) {
                    startBulkProcess('restore');
                }
                break;
            case 'convert-webp':
                startBulkProcess('webp');
                break;
        }
    });
    
    // Start bulk optimization
    $('.ifp-start-bulk').on('click', function() {
        const type = $(this).data('type');
        startBulkProcess(type);
    });
    
    // Tool actions
    $('.ifp-tool-action').on('click', function() {
        const action = $(this).data('action');
        alert('Action: ' + action + ' would run now');
    });
    
    // Dismiss persistent notices
    $(document).on('click', '.ifp-persistent-notice .notice-dismiss', function() {
        const notice = $(this).closest('.ifp-notice');
        const key = notice.data('notice-key');
        
        $.post(ifp_vars.ajax_url, {
            action: 'ifp_dismiss_notice',
            notice_type: key,
            nonce: ifp_vars.nonce
        });
    });
    
    // Bulk processing function
    function startBulkProcess(type) {
        const backup = $('#ifp-bulk-backup').is(':checked') ? 1 : 0;
        const webp = $('#ifp-bulk-webp').is(':checked') ? 1 : 0;
        const watermark = $('#ifp-bulk-watermark').is(':checked') ? 1 : 0;
        
        $('.ifp-progress').width('0%');
        $('.ifp-progress-text').text(ifp_vars.i18n.processing);
        $('.ifp-savings').text('');
        $('.ifp-start-bulk').hide();
        $('.ifp-pause').show();
        
        processBatch(type, 1, backup, webp, watermark, 0, 0);
    }
    
    function processBatch(type, page, backup, webp, watermark, totalProcessed, totalSavings) {
        $.post(ifp_vars.ajax_url, {
            action: 'ifp_bulk_' + type,
            page: page,
            backup: backup,
            webp: webp,
            watermark: watermark,
            nonce: ifp_vars.nonce
        }, function(response) {
            if (response.success) {
                const processed = response.data.processed;
                const savings = response.data.savings;
                const total = response.data.total;
                
                totalProcessed += processed;
                totalSavings += parseInt(savings.replace(/[^\d]/g, '') || 0);
                
                const progress = Math.min(100, Math.round((page * response.data.per_page) / total * 100));
                $('.ifp-progress').width(progress + '%');
                $('.ifp-progress-text').text(
                    ifp_vars.i18n.processing + ' ' + 
                    (page * response.data.per_page) + '/' + total
                );
                $('.ifp-savings').text(ifp_vars.i18n.savings + ' ' + formatBytes(totalSavings));
                
                if (!response.data.completed) {
                    processBatch(type, page + 1, backup, webp, watermark, totalProcessed, totalSavings);
                } else {
                    $('.ifp-progress-text').text(ifp_vars.i18n.completed);
                    $('.ifp-savings').text(ifp_vars.i18n.savings + ' ' + formatBytes(totalSavings));
                    $('.ifp-start-bulk').show();
                    $('.ifp-pause').hide();
                }
            } else {
                alert(ifp_vars.i18n.error + ': ' + response.data);
            }
        });
    }
    
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});
